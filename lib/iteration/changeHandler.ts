/**
 * Change Request Handler
 *
 * Processes user change requests for deployed sites.
 * Given a project's current file tree and the user's message,
 * identifies which files need to change, regenerates them,
 * commits to GitHub, and waits for Vercel auto-deploy.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';
import { CLAUDE_MODEL } from '@/lib/ai-config';
import { prisma } from '@/lib/db';

// ============================================
// TYPES
// ============================================

interface FileChange {
  filename: string;
  content: string;
}

interface ChangeResult {
  success: boolean;
  deployUrl?: string;
  diffSummary?: string;
  affectedFiles?: string[];
  error?: string;
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * Process a change request for a deployed project.
 *
 * Steps:
 * 1. Fetch current file tree from GitHub
 * 2. Call Claude with project context + user message
 * 3. Parse response into file changes
 * 4. Commit changes to GitHub (main branch)
 * 5. Vercel auto-deploys on push
 * 6. Poll for new deploy
 * 7. Update change request record
 */
export async function processChangeRequest(
  projectId: string,
  changeRequestId: string,
  userMessage: string
): Promise<ChangeResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    console.log(`[ChangeHandler] Processing change request ${changeRequestId} for project ${projectId}`);

    // Update status to PROCESSING
    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: { status: 'PROCESSING' },
    });

    // Get project + deployed app info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { deployedApp: true },
    });

    if (!project?.deployedApp?.githubRepoFullName) {
      throw new Error('Project has no deployed GitHub repository');
    }

    const repoFullName = project.deployedApp.githubRepoFullName;
    const [owner, repo] = repoFullName.split('/');

    // Step 1: Fetch current file tree from GitHub
    console.log('[ChangeHandler] Fetching current file tree...');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || process.env.GITHUB_PAT });

    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'main',
      recursive: 'true',
    });

    // Get contents of key files (skip node_modules, .next, etc.)
    const relevantFiles = tree.tree
      .filter(
        (item) =>
          item.type === 'blob' &&
          item.path &&
          !item.path.startsWith('node_modules/') &&
          !item.path.startsWith('.next/') &&
          !item.path.startsWith('.git/') &&
          !item.path.endsWith('.lock')
      )
      .slice(0, 50); // Limit to prevent token overflow

    const fileContents: string[] = [];
    for (const file of relevantFiles) {
      if (!file.path || !file.sha) continue;
      try {
        const { data: blob } = await octokit.git.getBlob({
          owner,
          repo,
          file_sha: file.sha,
        });
        const content = Buffer.from(blob.content, 'base64').toString('utf-8');
        // Only include text files under 5KB
        if (content.length < 5000) {
          fileContents.push(`--- ${file.path} ---\n${content}`);
        } else {
          fileContents.push(`--- ${file.path} --- (${content.length} chars, truncated)\n${content.substring(0, 2000)}...`);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    const projectContext = fileContents.join('\n\n');

    // Step 2: Call Claude with project context + user message
    console.log('[ChangeHandler] Asking Claude to generate changes...');
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: `You are an expert Next.js developer. The user has a deployed website and wants to make changes. Given the current file tree and the user's request, identify which files need to change and output ONLY those files regenerated.

Return a JSON array of objects with "filename" and "content" keys. Return ONLY valid JSON, no markdown wrapping, no explanation.

Example: [{"filename": "app/page.tsx", "content": "// updated content..."}]

Important:
- Only regenerate files that actually need changes
- Preserve all existing functionality that isn't being changed
- Keep the same tech stack and patterns`,
      messages: [
        {
          role: 'user',
          content: `Current project files:\n\n${projectContext}\n\n---\n\nUser's change request: "${userMessage}"\n\nReturn the JSON array of changed files:`,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    // Step 3: Parse response into file changes
    let fileChanges: FileChange[];
    try {
      // Strip markdown code fences if present
      const jsonText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      fileChanges = JSON.parse(jsonText);
    } catch {
      throw new Error('Failed to parse Claude response as JSON file changes');
    }

    if (!Array.isArray(fileChanges) || fileChanges.length === 0) {
      throw new Error('No file changes identified');
    }

    const affectedFiles = fileChanges.map((fc) => fc.filename);
    console.log(`[ChangeHandler] ${fileChanges.length} files to update: ${affectedFiles.join(', ')}`);

    // Step 4: Commit changes to GitHub
    console.log('[ChangeHandler] Committing changes to GitHub...');

    // Get latest commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });
    const latestCommitSha = ref.object.sha;

    const { data: latestCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });

    // Create blobs for changed files
    const treeItems: Array<{
      path: string;
      mode: '100644';
      type: 'blob';
      sha: string;
    }> = [];

    for (const change of fileChanges) {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(change.content).toString('base64'),
        encoding: 'base64',
      });

      treeItems.push({
        path: change.filename,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    // Create new tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      tree: treeItems,
      base_tree: latestCommit.tree.sha,
    });

    // Create commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: `Change request: ${userMessage.substring(0, 72)}`,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // Update ref
    await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha,
    });

    console.log(`[ChangeHandler] Committed ${fileChanges.length} files to ${repoFullName}`);

    // Step 5: Wait for Vercel auto-deploy (poll for new deployment)
    console.log('[ChangeHandler] Waiting for Vercel deployment...');
    const deployUrl = await waitForNewDeploy(
      project.deployedApp.vercelProjectId!,
      newCommit.sha
    );

    // Step 6: Update change request record
    const diffSummary = `Updated ${affectedFiles.length} file(s): ${affectedFiles.join(', ')}`;

    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: 'COMPLETE',
        affectedFiles,
        diffSummary,
        deployUrl,
        completedAt: new Date(),
      },
    });

    console.log(`[ChangeHandler] Change request complete. Deploy: ${deployUrl}`);

    return {
      success: true,
      deployUrl,
      diffSummary,
      affectedFiles,
    };
  } catch (error) {
    console.error('[ChangeHandler] Failed:', error);

    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: 'FAILED',
        diffSummary: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Change request failed',
    };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Wait for a new Vercel deployment after a git push.
 * Polls the Vercel API for a deployment matching the commit SHA.
 */
async function waitForNewDeploy(
  vercelProjectId: string,
  commitSha: string,
  maxWaitMs: number = 180000,
  pollIntervalMs: number = 10000
): Promise<string> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token) throw new Error('VERCEL_TOKEN not set');

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&teamId=${teamId}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const deployment = data.deployments?.find(
          (d: any) => d.meta?.githubCommitSha === commitSha && d.readyState === 'READY'
        );

        if (deployment) {
          return `https://${deployment.url}`;
        }
      }
    } catch {
      // Continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  // If we can't find the specific deployment, return the production URL
  console.warn('[ChangeHandler] Could not find specific deployment, using production URL');
  const prodResponse = await fetch(
    `https://api.vercel.com/v10/projects/${vercelProjectId}?teamId=${teamId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (prodResponse.ok) {
    const prodData = await prodResponse.json();
    const alias = prodData.targets?.production?.alias?.[0];
    if (alias) return `https://${alias}`;
  }

  return '';
}

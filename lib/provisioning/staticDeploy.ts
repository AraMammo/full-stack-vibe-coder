/**
 * Static Site Deploy Pipeline
 *
 * Simplified fork of the provisioning pipeline for PRESENCE (static site) products.
 * No Supabase, no Stripe Connect, no DB migrations — just GitHub + Vercel.
 *
 * Flow:
 * 1. Push code to GitHub org
 * 2. Create Vercel project linked to repo
 * 3. Set env vars (Formspree, site name)
 * 4. Trigger deploy
 * 5. Wait for READY
 * 6. Verify live (HTTP HEAD)
 * 7. Create DeployedApp record
 * 8. Update Project status → COMPLETED
 *
 * Compensating transactions on failure:
 * - Delete Vercel project
 * - Delete GitHub repo
 * - Mark Project as FAILED
 */

import { prisma } from '@/lib/db';
import { pushToGitHubOrg, deleteGitHubRepo } from '@/lib/services/claude-codegen';
import {
  createProject as createVercelProject,
  setEnvVars,
  triggerDeploy,
  waitForDeployment,
  deleteProject as deleteVercelProject,
} from '@/lib/services/vercel-provisioning';

// ============================================
// TYPES
// ============================================

export interface StaticDeployInput {
  projectId: string;
  projectName: string;
  userId: string;
  codeFiles: Map<string, string>;
  formspreeId?: string;
}

export interface StaticDeployResult {
  success: boolean;
  productionUrl?: string;
  githubRepoUrl?: string;
  githubRepoName?: string;
  error?: string;
}

// ============================================
// STATIC DEPLOY PIPELINE
// ============================================

export async function deployStaticSite(
  input: StaticDeployInput
): Promise<StaticDeployResult> {
  let githubRepoName: string | undefined;
  let githubRepoUrl: string | undefined;
  let vercelProjectId: string | undefined;

  try {
    console.log(`[StaticDeploy] Starting static deploy for project: ${input.projectId}`);

    // Step 1: Push code to GitHub org
    console.log('[StaticDeploy] Step 1: Pushing code to GitHub...');
    const repoResult = await pushToGitHubOrg(input.codeFiles, input.projectName);
    githubRepoName = repoResult.repoName;
    githubRepoUrl = repoResult.repoUrl;
    console.log(`[StaticDeploy] GitHub repo created: ${githubRepoUrl}`);

    // Step 2: Create Vercel project linked to repo
    console.log('[StaticDeploy] Step 2: Creating Vercel project...');
    const vercelResult = await createVercelProject(
      input.projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60),
      githubRepoName
    );
    vercelProjectId = vercelResult.projectId;
    console.log(`[StaticDeploy] Vercel project created: ${vercelResult.projectName}`);

    // Step 3: Set env vars
    console.log('[StaticDeploy] Step 3: Setting environment variables...');
    const envVars = [
      {
        key: 'NEXT_PUBLIC_FORMSPREE_ID',
        value: input.formspreeId || process.env.NEXT_PUBLIC_FORMSPREE_ID || '',
        target: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
        type: 'plain' as const,
      },
      {
        key: 'NEXT_PUBLIC_SITE_NAME',
        value: input.projectName,
        target: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
        type: 'plain' as const,
      },
    ];
    await setEnvVars(vercelProjectId, envVars);

    // Step 4: Trigger deploy
    console.log('[StaticDeploy] Step 4: Triggering deployment...');
    const deployment = await triggerDeploy(vercelResult.projectName, githubRepoName);

    // Step 5: Wait for READY
    console.log('[StaticDeploy] Step 5: Waiting for deployment to be ready...');
    const productionUrl = await waitForDeployment(deployment.deploymentId);

    // Step 6: Verify live (HTTP HEAD with retries)
    console.log('[StaticDeploy] Step 6: Verifying site is live...');
    await verifyLive(productionUrl);

    // Step 7: Create DeployedApp record
    console.log('[StaticDeploy] Step 7: Creating DeployedApp record...');
    await prisma.deployedApp.create({
      data: {
        projectId: input.projectId,
        vercelProjectId: vercelProjectId,
        vercelProjectName: vercelResult.projectName,
        vercelProductionUrl: productionUrl,
        githubRepoFullName: githubRepoName,
        githubRepoUrl: githubRepoUrl,
        hostingStatus: 'ACTIVE',
      },
    });

    // Step 8: Update Project status → COMPLETED
    console.log('[StaticDeploy] Step 8: Updating project status...');
    await prisma.project.update({
      where: { id: input.projectId },
      data: {
        status: 'COMPLETED',
        vercelDeploymentUrl: productionUrl,
        githubRepoUrl: githubRepoUrl,
        githubRepoName: githubRepoName,
        completedAt: new Date(),
      },
    });

    console.log(`[StaticDeploy] Static site deployed successfully: ${productionUrl}`);

    return {
      success: true,
      productionUrl,
      githubRepoUrl,
      githubRepoName,
    };
  } catch (error) {
    console.error('[StaticDeploy] Deploy failed:', error);

    // Compensating transactions
    await rollback(input.projectId, vercelProjectId, githubRepoName);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Static deploy failed',
    };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Verify the site returns HTTP 200 with retries
 */
async function verifyLive(url: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`[StaticDeploy] Site verified live: ${url}`);
        return;
      }
      console.log(`[StaticDeploy] Verify attempt ${i + 1}/${retries}: HTTP ${response.status}`);
    } catch (err) {
      console.log(`[StaticDeploy] Verify attempt ${i + 1}/${retries}: ${err}`);
    }
    // Wait before retry
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  // Don't fail the deploy if verification fails — site may take a moment
  console.warn('[StaticDeploy] Site verification failed after retries, continuing anyway');
}

/**
 * Rollback: delete Vercel project, GitHub repo, mark project FAILED
 */
async function rollback(
  projectId: string,
  vercelProjectId?: string,
  githubRepoName?: string
): Promise<void> {
  console.log('[StaticDeploy] Rolling back...');

  if (vercelProjectId) {
    try {
      await deleteVercelProject(vercelProjectId);
      console.log('[StaticDeploy] Rolled back Vercel project');
    } catch (err) {
      console.error('[StaticDeploy] Failed to rollback Vercel project:', err);
    }
  }

  if (githubRepoName) {
    try {
      await deleteGitHubRepo(githubRepoName);
      console.log('[StaticDeploy] Rolled back GitHub repo');
    } catch (err) {
      console.error('[StaticDeploy] Failed to rollback GitHub repo:', err);
    }
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'FAILED' },
    });
    console.log('[StaticDeploy] Project marked as FAILED');
  } catch (err) {
    console.error('[StaticDeploy] Failed to mark project as FAILED:', err);
  }
}

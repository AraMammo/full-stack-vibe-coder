/**
 * Claude Code Generation Service
 *
 * Generates complete Next.js codebases via multi-step Claude calls.
 * Replaces v0.dev integration with direct Claude-powered code generation.
 *
 * Flow:
 * 1. Takes structured input from orchestrator (brand identity, business details)
 * 2. Generates files via focused Claude prompts
 * 3. Collects into Map<filepath, content>
 * 4. Pushes to GitHub via Octokit
 * 5. Deploys to Vercel via Vercel API
 * 6. Returns repo URL + live site URL
 */

import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';

// ============================================
// TYPES
// ============================================

export interface CodegenInput {
  projectName: string;
  businessConcept: string;
  brandIdentity: string;
  appArchitecture: string;
  codebaseSpec: string; // Full spec including industry context
  approvedPreviewHtml?: string; // The landing page design the customer approved
}

export interface CodegenResult {
  success: boolean;
  files?: Map<string, string>;
  githubRepoUrl?: string;
  githubRepoName?: string;
  vercelDeploymentUrl?: string;
  error?: string;
}

interface GeneratedFile {
  filepath: string;
  content: string;
}

// ============================================
// CODEGEN SERVICE
// ============================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

import { CLAUDE_MODEL } from '@/lib/ai-config';

const MODEL = CLAUDE_MODEL;
const MAX_TOKENS = 16384;

/**
 * Main entry point: generate a complete Next.js codebase
 */
export async function generateCodebase(input: CodegenInput): Promise<CodegenResult> {
  try {
    console.log(`[Codegen] Starting codebase generation for: ${input.projectName}`);

    // Step 1: Generate the full codebase via Claude
    const files = await generateFullCodebase(input);

    console.log(`[Codegen] Generated ${files.size} files`);

    // Step 2: Ensure critical files exist
    await ensureCriticalFiles(files, input);

    console.log(`[Codegen] Final file count: ${files.size}`);

    // Step 3: Push to GitHub (if configured)
    let githubRepoUrl: string | undefined;
    let githubRepoName: string | undefined;

    if (process.env.GITHUB_TOKEN || process.env.GITHUB_PAT) {
      const repoResult = await pushToGitHub(files, input.projectName);
      githubRepoUrl = repoResult.repoUrl;
      githubRepoName = repoResult.repoName;
      console.log(`[Codegen] Pushed to GitHub: ${githubRepoUrl}`);
    } else {
      console.log('[Codegen] Skipping GitHub push (GITHUB_TOKEN not set)');
    }

    // Step 4: Deploy to Vercel (if configured)
    let vercelDeploymentUrl: string | undefined;

    if (process.env.VERCEL_TOKEN && githubRepoName) {
      vercelDeploymentUrl = await deployToVercel(githubRepoName);
      console.log(`[Codegen] Deployed to Vercel: ${vercelDeploymentUrl}`);
    } else {
      console.log('[Codegen] Skipping Vercel deploy (VERCEL_TOKEN not set or no repo)');
    }

    return {
      success: true,
      files,
      githubRepoUrl,
      githubRepoName,
      vercelDeploymentUrl,
    };

  } catch (error) {
    console.error('[Codegen] Generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown codegen error',
    };
  }
}

/**
 * Sanitize a filepath: reject path traversal, absolute paths, normalize separators
 */
function sanitizeFilepath(filepath: string): string | null {
  const trimmed = filepath.trim();
  // Reject absolute paths
  if (trimmed.startsWith('/') || trimmed.startsWith('\\') || /^[A-Z]:/i.test(trimmed)) {
    console.warn(`[Codegen] Rejected absolute path: ${trimmed}`);
    return null;
  }
  // Reject path traversal
  if (trimmed.includes('..')) {
    console.warn(`[Codegen] Rejected path traversal: ${trimmed}`);
    return null;
  }
  // Normalize backslashes to forward slashes
  return trimmed.replace(/\\/g, '/');
}

/**
 * Parse code files from the orchestrator's codebase spec output.
 * Supports multiple formats:
 * 1. ```filepath: path/to/file.tsx\n...content...\n```
 * 2. ```path/to/file.tsx\n...content...\n```
 * 3. // filepath: path/to/file.tsx\n...content...
 */
export function parseCodebaseOutput(codebaseSpec: string): Map<string, string> {
  const files = new Map<string, string>();

  // Pattern 1: Code blocks with "filepath:" marker (most common)
  const fileBlockRegex = /```(?:(?:typescript|tsx?|javascript|jsx?|json|css|prisma|env|text|markdown|md)\s+)?filepath:\s*(.+?)\n([\s\S]*?)```/g;
  let match;

  while ((match = fileBlockRegex.exec(codebaseSpec)) !== null) {
    const filepath = sanitizeFilepath(match[1]);
    const content = match[2].trim();
    if (filepath && content) {
      files.set(filepath, content);
    }
  }

  // Pattern 2: Simple format — ```path/to/file\n...\n```
  if (files.size === 0) {
    const simpleRegex = /```\s*([a-zA-Z][\w./\-]+\.[a-zA-Z]+)\n([\s\S]*?)```/g;
    while ((match = simpleRegex.exec(codebaseSpec)) !== null) {
      const filepath = sanitizeFilepath(match[1]);
      const content = match[2].trim();
      if (filepath && content && filepath.includes('/')) {
        files.set(filepath, content);
      }
    }
  }

  // Pattern 3: Comment-header style — // filepath: path/to/file.tsx
  if (files.size === 0) {
    const commentRegex = /\/\/\s*filepath:\s*(.+?)\n([\s\S]*?)(?=\/\/\s*filepath:|$)/g;
    while ((match = commentRegex.exec(codebaseSpec)) !== null) {
      const filepath = sanitizeFilepath(match[1]);
      const content = match[2].trim();
      if (filepath && content) {
        files.set(filepath, content);
      }
    }
  }

  if (files.size === 0) {
    console.error(`[Codegen] parseCodebaseOutput: 0 files parsed from ${codebaseSpec.length} chars of spec`);
  } else {
    console.log(`[Codegen] parseCodebaseOutput: parsed ${files.size} files`);
  }

  return files;
}

/**
 * Generate the complete codebase via Claude.
 *
 * Makes multiple focused calls to stay within token limits:
 * 1. Core config + layout + landing page (uses approved preview as design reference)
 * 2. Feature pages + API routes + database schema
 * 3. Components + utilities
 */
async function generateFullCodebase(input: CodegenInput): Promise<Map<string, string>> {
  const allFiles = new Map<string, string>();

  // ── System prompt shared across all calls ──
  const systemPrompt = `You are a senior Next.js engineer who builds production-quality applications. You generate complete, working code — not stubs, not placeholders.

Tech stack: Next.js 14 (App Router), TypeScript, Tailwind CSS v3, Prisma ORM + PostgreSQL, NextAuth.js (Google OAuth), Stripe.

Output EVERY file as:
\`\`\`filepath: path/to/file.ext
file contents here
\`\`\`

Rules:
- Use the exact brand colors provided. Wire them into tailwind.config.ts as custom colors.
- Every page must be mobile-responsive.
- Use semantic HTML. Add real copy — no "Lorem ipsum" or "[Your text here]".
- Build features THIS business actually needs. No generic placeholder pages.
- All API routes use proper error handling and input validation.
- Prisma schema must include models specific to this business type.`;

  // ── Call 1: Config + Layout + Landing Page ──
  console.log('[Codegen] Call 1/3: Config, layout, and landing page...');

  let landingPageInstruction = `Generate the landing page (app/page.tsx) as a premium, conversion-focused page specific to this business.`;

  if (input.approvedPreviewHtml) {
    landingPageInstruction = `CRITICAL: The customer approved the following landing page design. Your app/page.tsx MUST match this design — same layout structure, same color scheme, same copy tone, same visual hierarchy. Convert it from standalone HTML to a Next.js React component using Tailwind CSS classes. Keep the design EXACTLY as approved:

═══ APPROVED LANDING PAGE DESIGN ═══
${input.approvedPreviewHtml}
═══ END APPROVED DESIGN ═══`;
  }

  const call1 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Generate the foundation files for "${input.projectName}":

${input.brandIdentity}

${input.businessConcept}

${landingPageInstruction}

Generate these files:
1. package.json (all dependencies: next, react, react-dom, typescript, tailwindcss, prisma, @prisma/client, next-auth, stripe, @stripe/stripe-js, zod)
2. tsconfig.json
3. next.config.js
4. tailwind.config.ts (with brand colors as custom theme colors)
5. app/layout.tsx (with proper metadata, Google Fonts, global providers)
6. app/globals.css (Tailwind directives + brand CSS variables)
7. app/page.tsx (the landing page — MUST match the approved design if provided)
8. components/Navigation.tsx (responsive, mobile hamburger menu)
9. components/Footer.tsx (with business info, links, copyright)
10. .env.example`,
    }],
  });

  const text1 = call1.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
  parseCodebaseOutput(text1).forEach((content, path) => allFiles.set(path, content));
  console.log(`[Codegen] Call 1 complete: ${allFiles.size} files`);

  // ── Call 2: Feature pages + API routes + Prisma schema ──
  console.log('[Codegen] Call 2/3: Feature pages, API routes, database schema...');

  const call2 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Continue building "${input.projectName}". The config and landing page are done.

${input.businessConcept}

${input.codebaseSpec}

Now generate:
1. prisma/schema.prisma (models specific to this business — users, products/services, bookings/orders, payments, etc.)
2. app/about/page.tsx (company story, team, mission — real copy for this business)
3. app/services/page.tsx or app/products/page.tsx (whatever fits this business)
4. app/contact/page.tsx (contact form with validation)
5. app/api/contact/route.ts (form submission handler with Zod validation)
6. app/api/auth/[...nextauth]/route.ts (NextAuth config with Google provider)
7. lib/auth.ts (NextAuth options)
8. lib/db.ts (Prisma client singleton)
9. lib/stripe.ts (Stripe client)
10. Any additional pages or API routes this specific business type needs`,
    }],
  });

  const text2 = call2.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
  parseCodebaseOutput(text2).forEach((content, path) => {
    if (!allFiles.has(path)) allFiles.set(path, content);
  });
  console.log(`[Codegen] Call 2 complete: ${allFiles.size} total files`);

  // ── Call 3: Dashboard, auth pages, remaining components ──
  console.log('[Codegen] Call 3/3: Dashboard, auth pages, components...');

  const call3 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Final batch for "${input.projectName}".

${input.brandIdentity}

${input.businessConcept}

Generate:
1. app/dashboard/page.tsx (customer dashboard — show their bookings/orders/purchases)
2. app/dashboard/layout.tsx (dashboard shell with sidebar nav)
3. app/auth/signin/page.tsx (branded sign-in page)
4. app/api/stripe/checkout/route.ts (create Stripe checkout session for this business's products/services)
5. app/api/stripe/webhook/route.ts (handle payment events)
6. components/ui/Button.tsx (reusable button with variants)
7. components/ui/Card.tsx (reusable card component)
8. components/ui/Input.tsx (form input with label + error state)
9. Any industry-specific components this business needs (booking widget, service cards, pricing table, etc.)
10. middleware.ts (protect dashboard routes)`,
    }],
  });

  const text3 = call3.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
  parseCodebaseOutput(text3).forEach((content, path) => {
    if (!allFiles.has(path)) allFiles.set(path, content);
  });
  console.log(`[Codegen] Call 3 complete: ${allFiles.size} total files`);

  if (allFiles.size < 5) {
    throw new Error(`Code generation produced only ${allFiles.size} files — expected at least 10`);
  }

  return allFiles;
}

/**
 * Ensure critical config files exist
 */
async function ensureCriticalFiles(files: Map<string, string>, input: CodegenInput): Promise<void> {
  // Ensure README.md exists
  if (!files.has('README.md')) {
    files.set('README.md', `# ${input.projectName}

Generated by Full Stack Vibe Coder.

## Getting Started

\`\`\`bash
npm install
cp .env.example .env.local
# Fill in environment variables
npx prisma db push
npm run dev
\`\`\`

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js
- Stripe

## Deployment

Deploy to Vercel:

\`\`\`bash
npx vercel
\`\`\`
`);
  }

  // Ensure .env.example exists
  if (!files.has('.env.example')) {
    files.set('.env.example', `# Database (PostgreSQL — any provider)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="generate-a-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
`);
  }
}

/**
 * Push generated files to a new GitHub repository (personal account, legacy)
 */
async function pushToGitHub(
  files: Map<string, string>,
  projectName: string
): Promise<{ repoUrl: string; repoName: string }> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || process.env.GITHUB_PAT });

  // Create repo name from project name
  const repoName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

  console.log(`[Codegen] Creating GitHub repo: ${repoName}`);

  // Create repository
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description: `Generated by Full Stack Vibe Coder — ${projectName}`,
    private: false,
    auto_init: true, // Creates with README
  });

  // Wait a moment for the repo to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get the default branch's latest commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner: repo.owner.login,
    repo: repoName,
    ref: 'heads/main',
  });

  const latestCommitSha = ref.object.sha;

  // Get the tree of the latest commit
  const { data: latestCommit } = await octokit.git.getCommit({
    owner: repo.owner.login,
    repo: repoName,
    commit_sha: latestCommitSha,
  });

  // Create blobs for all files
  const treeItems: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string;
  }> = [];

  const fileEntries = Array.from(files.entries());
  for (const [filepath, content] of fileEntries) {
    const { data: blob } = await octokit.git.createBlob({
      owner: repo.owner.login,
      repo: repoName,
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64',
    });

    treeItems.push({
      path: filepath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner: repo.owner.login,
    repo: repoName,
    tree: treeItems,
    base_tree: latestCommit.tree.sha,
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner: repo.owner.login,
    repo: repoName,
    message: 'Initial codebase generated by Full Stack Vibe Coder',
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // Update ref
  await octokit.git.updateRef({
    owner: repo.owner.login,
    repo: repoName,
    ref: 'heads/main',
    sha: commit.sha,
  });

  console.log(`[Codegen] Pushed ${files.size} files to ${repo.html_url}`);

  return {
    repoUrl: repo.html_url,
    repoName: `${repo.owner.login}/${repoName}`,
  };
}

/**
 * Deploy to Vercel from GitHub repo (legacy standalone - use provisioning pipeline instead)
 */
async function deployToVercel(githubRepoName: string): Promise<string | undefined> {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) return undefined;

    const [owner, repo] = githubRepoName.split('/');

    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repo,
        gitSource: {
          type: 'github',
          org: owner,
          repo: repo,
          ref: 'main',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Codegen] Vercel deploy failed:', error);
      return undefined;
    }

    const data = await response.json();
    const deploymentUrl = `https://${data.url}`;

    console.log(`[Codegen] Vercel deployment: ${deploymentUrl}`);
    return deploymentUrl;

  } catch (error) {
    console.error('[Codegen] Vercel deploy error:', error);
    return undefined;
  }
}

/**
 * Push generated files to GitHub under the FSVC organization.
 * Used by the provisioning pipeline for hosted customer apps.
 */
export async function pushToGitHubOrg(
  files: Map<string, string>,
  projectName: string
): Promise<{ repoUrl: string; repoName: string }> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || process.env.GITHUB_PAT });
  const org = process.env.GITHUB_ORG_NAME || 'fsvc-apps';

  const repoName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

  console.log(`[Codegen] Creating GitHub repo in org ${org}: ${repoName}`);

  const { data: repo } = await octokit.repos.createInOrg({
    org,
    name: repoName,
    description: `Generated by Full Stack Vibe Coder — ${projectName}`,
    private: true,
    auto_init: true,
  });

  // Wait for repo to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get the default branch's latest commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner: org,
    repo: repoName,
    ref: 'heads/main',
  });

  const latestCommitSha = ref.object.sha;

  const { data: latestCommit } = await octokit.git.getCommit({
    owner: org,
    repo: repoName,
    commit_sha: latestCommitSha,
  });

  // Create blobs for all files
  const treeItems: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string;
  }> = [];

  const fileEntries = Array.from(files.entries());
  for (const [filepath, content] of fileEntries) {
    const { data: blob } = await octokit.git.createBlob({
      owner: org,
      repo: repoName,
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64',
    });

    treeItems.push({
      path: filepath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner: org,
    repo: repoName,
    tree: treeItems,
    base_tree: latestCommit.tree.sha,
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner: org,
    repo: repoName,
    message: 'Initial codebase generated by Full Stack Vibe Coder',
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // Update ref
  await octokit.git.updateRef({
    owner: org,
    repo: repoName,
    ref: 'heads/main',
    sha: commit.sha,
  });

  console.log(`[Codegen] Pushed ${files.size} files to ${repo.html_url}`);

  return {
    repoUrl: repo.html_url,
    repoName: `${org}/${repoName}`,
  };
}

/**
 * Delete a GitHub repository (for cleanup on provisioning failure).
 * Takes a full name like "fsvc-apps/my-project".
 */
export async function deleteGitHubRepo(repoFullName: string): Promise<void> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || process.env.GITHUB_PAT });
  const [owner, repo] = repoFullName.split('/');

  await octokit.repos.delete({ owner, repo });
  console.log(`[Codegen] Deleted GitHub repo: ${repoFullName}`);
}

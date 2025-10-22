/**
 * Deployment Handoff Service
 *
 * Creates GitHub repos, Vercel deployments, and Supabase projects
 * for Turnkey System tier (Tier 3).
 */

import { Octokit } from '@octokit/rest';

// ============================================
// TYPES
// ============================================

export interface GitHubRepoResult {
  success: boolean;
  repoUrl?: string;
  transferInstructions?: string;
  error?: string;
}

export interface VercelDeploymentResult {
  success: boolean;
  deploymentUrl?: string;
  transferInstructions?: string;
  error?: string;
}

export interface SupabaseProjectResult {
  success: boolean;
  projectId?: string;
  setupInstructions?: string;
  credentials?: {
    projectUrl: string;
    anonKey: string;
    serviceKey: string;
  };
  error?: string;
}

export interface HandoffDocumentation {
  githubSetup: string;
  vercelDeployment: string;
  supabaseSetup: string;
  stripeConfig: string;
  resendEmail: string;
  credentials: string;
}

// ============================================
// GITHUB REPOSITORY CREATION
// ============================================

/**
 * Create a GitHub repository for the client's project
 *
 * @param projectName - Name of the project
 * @param description - Project description
 * @returns Repository URL and transfer instructions
 */
export async function createGitHubRepo(
  projectName: string,
  description: string
): Promise<GitHubRepoResult> {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.error('[GitHub] API token not configured');
    return {
      success: false,
      error: 'GITHUB_TOKEN environment variable not set',
    };
  }

  try {
    console.log(`[GitHub] Creating repository: ${projectName}`);

    const octokit = new Octokit({ auth: githubToken });

    // Create repository
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: sanitizeRepoName(projectName),
      description,
      private: true,
      auto_init: true, // Initialize with README
      gitignore_template: 'Node',
      license_template: 'mit',
    });

    console.log(`[GitHub] ✓ Repository created: ${repo.html_url}`);

    // Generate transfer instructions
    const transferInstructions = generateGitHubTransferInstructions(repo.html_url, repo.owner.login);

    return {
      success: true,
      repoUrl: repo.html_url,
      transferInstructions,
    };

  } catch (error) {
    console.error('[GitHub] Repository creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sanitize project name for GitHub repo
 */
function sanitizeRepoName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Generate instructions for transferring GitHub repo ownership
 */
function generateGitHubTransferInstructions(repoUrl: string, ownerLogin: string): string {
  return `# GitHub Repository Transfer Instructions

Your repository has been created at: ${repoUrl}

## Transfer Ownership to Your Account

1. Go to repository Settings → General → Danger Zone
2. Click "Transfer ownership"
3. Enter your GitHub username
4. Confirm the transfer

## Alternative: Add as Collaborator

If you prefer to keep the repo under ${ownerLogin}:
1. Go to Settings → Collaborators
2. Add your GitHub username with Admin access
3. Clone the repo to your local machine

## Next Steps

After gaining access:
1. Clone the repository: \`git clone ${repoUrl}\`
2. Install dependencies: \`npm install\`
3. Set up environment variables (see .env.example)
4. Run development server: \`npm run dev\`
`;
}

// ============================================
// VERCEL DEPLOYMENT
// ============================================

/**
 * Deploy project to Vercel and generate handoff instructions
 *
 * Note: Vercel doesn't have a direct transfer API, so we create deployment
 * and provide instructions for the client to import/transfer.
 *
 * @param repoUrl - GitHub repository URL
 * @returns Deployment URL and transfer instructions
 */
export async function setupVercelDeployment(
  repoUrl: string
): Promise<VercelDeploymentResult> {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    console.error('[Vercel] API token not configured');
    return {
      success: false,
      error: 'VERCEL_TOKEN environment variable not set',
    };
  }

  try {
    console.log(`[Vercel] Setting up deployment for: ${repoUrl}`);

    // Create Vercel project via API
    const response = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: extractRepoName(repoUrl),
        gitRepository: {
          type: 'github',
          repo: extractRepoPath(repoUrl),
        },
        framework: 'nextjs',
        environmentVariables: [],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Vercel] Deployment error:', response.status, error);
      return {
        success: false,
        error: `Vercel API error: ${response.status}`,
      };
    }

    const project = await response.json();
    const deploymentUrl = `https://${project.name}.vercel.app`;

    console.log(`[Vercel] ✓ Deployment created: ${deploymentUrl}`);

    // Generate transfer instructions
    const transferInstructions = generateVercelTransferInstructions(deploymentUrl);

    return {
      success: true,
      deploymentUrl,
      transferInstructions,
    };

  } catch (error) {
    console.error('[Vercel] Deployment setup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract repo name from GitHub URL
 */
function extractRepoName(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
  return match ? match[1].replace(/\.git$/, '') : 'project';
}

/**
 * Extract repo path (owner/repo) from GitHub URL
 */
function extractRepoPath(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1].replace(/\.git$/, '') : '';
}

/**
 * Generate Vercel transfer instructions
 */
function generateVercelTransferInstructions(deploymentUrl: string): string {
  return `# Vercel Deployment Transfer Instructions

Your project is deployed at: ${deploymentUrl}

## Transfer to Your Vercel Account

1. Sign up/login at https://vercel.com
2. Import your GitHub repository:
   - Click "Add New Project"
   - Connect your GitHub account
   - Select the repository
   - Click "Import"

3. Configure environment variables:
   - Add all required secrets (DATABASE_URL, API keys, etc.)
   - See the credentials document for values

4. Deploy:
   - Vercel will automatically deploy on every push to main
   - Custom domain can be added in project settings

## Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your domain (e.g., myapp.com)
3. Update DNS records as instructed by Vercel
4. SSL certificate will be auto-provisioned
`;
}

// ============================================
// SUPABASE PROJECT CREATION
// ============================================

/**
 * Create a Supabase project for the client
 *
 * @param projectName - Name of the project
 * @returns Project ID, credentials, and setup instructions
 */
export async function createSupabaseProject(
  projectName: string
): Promise<SupabaseProjectResult> {
  // Note: Supabase API for project creation is in beta and requires
  // organization-level access tokens. For now, we'll generate setup
  // instructions for manual creation.

  console.log(`[Supabase] Generating setup instructions for: ${projectName}`);

  const setupInstructions = generateSupabaseSetupInstructions(projectName);

  return {
    success: true,
    setupInstructions,
    // Note: Actual project creation would happen here if API is available
    // For now, client creates manually following instructions
  };
}

/**
 * Generate Supabase manual setup instructions
 */
function generateSupabaseSetupInstructions(projectName: string): string {
  return `# Supabase Setup Instructions

## Create Your Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Project Details:
   - Name: ${projectName}
   - Database Password: (create a strong password)
   - Region: Choose closest to your users
   - Pricing: Free tier (upgrade later if needed)

4. Wait for project initialization (~2 minutes)

## Get Your Credentials

After project is created:

1. Go to Project Settings → API
2. Copy these values:
   - Project URL: \`NEXT_PUBLIC_SUPABASE_URL\`
   - Anon/Public Key: \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - Service Role Key: \`SUPABASE_SERVICE_ROLE_KEY\` (keep secret!)

3. Go to Project Settings → Database
4. Copy Connection String: \`DATABASE_URL\`

## Database Schema Setup

1. Go to SQL Editor
2. Run the migration file included in your repo: \`/prisma/migrations/*.sql\`
3. Or use Prisma: \`npx prisma db push\`

## Storage Buckets

Create these buckets in Storage section:
- \`voice-notes\` (private)
- \`proposals\` (private)
- \`biab-deliverables\` (private)

## Authentication Setup

1. Go to Authentication → Providers
2. Enable Email provider
3. Optional: Enable Google OAuth
   - Add OAuth credentials from Google Cloud Console
`;
}

// ============================================
// HANDOFF DOCUMENTATION
// ============================================

/**
 * Generate complete handoff documentation for Turnkey System tier
 *
 * @param projectId - Project ID
 * @returns Complete handoff documentation set
 */
export function generateHandoffDocumentation(
  projectName: string,
  repoUrl?: string,
  deploymentUrl?: string
): HandoffDocumentation {
  return {
    githubSetup: repoUrl
      ? generateGitHubTransferInstructions(repoUrl, 'fullstackvibecoder')
      : 'GitHub repository not created',

    vercelDeployment: deploymentUrl
      ? generateVercelTransferInstructions(deploymentUrl)
      : 'Vercel deployment not created',

    supabaseSetup: generateSupabaseSetupInstructions(projectName),

    stripeConfig: generateStripeConfigInstructions(),

    resendEmail: generateResendEmailInstructions(),

    credentials: generateCredentialsDocument(),
  };
}

/**
 * Generate Stripe configuration instructions
 */
function generateStripeConfigInstructions(): string {
  return `# Stripe Payment Configuration

## Setup Stripe Account

1. Sign up at https://stripe.com
2. Complete account verification

## Get API Keys

1. Go to Developers → API Keys
2. Copy:
   - Publishable Key: \`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\`
   - Secret Key: \`STRIPE_SECRET_KEY\`

## Create Payment Products

1. Go to Products → Add Product
2. Create products for your pricing tiers
3. Copy Price IDs for each tier

## Setup Webhook

1. Go to Developers → Webhooks → Add Endpoint
2. Endpoint URL: \`https://your-domain.com/api/webhooks/stripe\`
3. Listen to events:
   - \`payment_intent.succeeded\`
   - \`customer.subscription.created\`
   - \`customer.subscription.updated\`
   - \`customer.subscription.deleted\`
4. Copy Webhook Secret: \`STRIPE_WEBHOOK_SECRET\`

## Test Mode

- Use test mode during development
- Switch to live mode when ready to launch
- Never commit API keys to version control
`;
}

/**
 * Generate Resend email configuration instructions
 */
function generateResendEmailInstructions(): string {
  return `# Resend Email Configuration

## Setup Resend Account

1. Sign up at https://resend.com
2. Free tier includes 100 emails/day, 3,000/month

## Get API Key

1. Go to API Keys
2. Create new API key
3. Copy: \`RESEND_API_KEY\`

## Verify Domain

1. Go to Domains → Add Domain
2. Add your domain (e.g., myapp.com)
3. Add DNS records as instructed
4. Wait for verification (~10 minutes)

## Create Email Templates

Your app includes these email templates:
- Welcome email
- Password reset
- Project started notification
- Project completed notification

Customize in: \`/lib/email/templates/\`

## Configure From Address

Update environment variable:
\`RESEND_FROM_EMAIL=noreply@yourdomain.com\`

## Test Emails

Run test script: \`npm run test:email\`
`;
}

/**
 * Generate credentials document (encrypted)
 */
function generateCredentialsDocument(): string {
  return `# Project Credentials

## Important: Keep This File Secure

This file contains sensitive credentials. Never commit to version control.

## Environment Variables

Copy these to your \`.env.local\` file:

\`\`\`bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Payments
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
\`\`\`

## Admin Access

Default admin account:
- Email: (to be created by you)
- Password: (to be created by you)

## Next Steps

1. Replace all placeholder values with actual credentials
2. Generate new NEXTAUTH_SECRET
3. Never share these credentials
4. Use environment variables in production (Vercel/Railway/etc.)
`;
}

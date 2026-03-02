/**
 * Provisioning Pipeline
 *
 * The core orchestrator that ties all infrastructure services together.
 * Runs sequentially since each step depends on the previous.
 *
 * Flow:
 * 1. Create Supabase project → DATABASE_URL, keys
 * 2. Run database migrations → uses DATABASE_URL from step 1
 * 3. Create Stripe Connect account → STRIPE_CONNECT_ACCOUNT_ID
 * 4. Push code to GitHub (ShipKit org) → GITHUB_REPO_URL
 * 5. Create Vercel project → inject all env vars from steps 1-3
 * 6. Trigger deployment → wait for READY
 * 7. Verify live (HTTP 200 check) → PRODUCTION_URL confirmed
 * 8. Create DeployedApp record → store all credentials
 */

import { prisma } from '@/lib/db';
import * as supabase from './supabase-provisioning';
import * as vercel from './vercel-provisioning';
import * as stripeConnect from './stripe-connect';
import { pushToGitHubOrg } from './claude-codegen';

export interface ProvisioningInput {
  projectId: string;
  projectName: string;
  userId: string;
  userEmail: string;
  codeFiles: Map<string, string>;
  migrationSql?: string;
}

interface ProvisioningLogEntry {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  error?: string;
  data?: Record<string, unknown>;
}

export type ProvisioningProgressCallback = (
  step: string,
  status: 'running' | 'completed' | 'failed',
  data?: Record<string, unknown>
) => void;

export interface ProvisioningResult {
  success: boolean;
  deployedAppId?: string;
  productionUrl?: string;
  githubRepoUrl?: string;
  stripeConnectOnboardingUrl?: string;
  error?: string;
}

/**
 * Run the full provisioning pipeline
 */
export async function provisionInfrastructure(
  input: ProvisioningInput,
  onProgress?: ProvisioningProgressCallback
): Promise<ProvisioningResult> {
  const log: ProvisioningLogEntry[] = [];
  const startTime = Date.now();

  const logStep = (step: string, status: ProvisioningLogEntry['status'], error?: string, data?: Record<string, unknown>) => {
    log.push({ step, status, timestamp: new Date().toISOString(), error, data });
    if (onProgress && status !== 'pending') {
      onProgress(step, status as 'running' | 'completed' | 'failed', data);
    }
  };

  // Track infrastructure state for cleanup on failure
  let supabaseRef: string | undefined;
  let vercelProjectId: string | undefined;
  let githubRepoFullName: string | undefined;

  try {
    // ========================================
    // Step 1: Create Supabase project
    // ========================================
    logStep('supabase_create', 'running');
    const supabaseResult = await supabase.provisionProject(
      sanitizeName(input.projectName)
    );
    supabaseRef = supabaseResult.projectRef;
    logStep('supabase_create', 'completed', undefined, {
      projectRef: supabaseResult.projectRef,
      projectUrl: supabaseResult.projectUrl,
    });

    // ========================================
    // Step 2: Run database migrations
    // ========================================
    if (input.migrationSql) {
      logStep('database_migrate', 'running');
      await supabase.runMigration(supabaseResult.projectRef, input.migrationSql);
      logStep('database_migrate', 'completed');
    } else {
      logStep('database_migrate', 'completed', undefined, { skipped: true });
    }

    // ========================================
    // Step 3: Create Stripe Connect account
    // ========================================
    logStep('stripe_connect', 'running');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard/project/${input.projectId}`;
    const connectResult = await stripeConnect.provisionConnectAccount(
      input.userEmail,
      input.projectName,
      returnUrl
    );
    logStep('stripe_connect', 'completed', undefined, {
      accountId: connectResult.accountId,
    });

    // ========================================
    // Step 4: Push code to GitHub (ShipKit org)
    // ========================================
    logStep('github_push', 'running');
    const githubResult = await pushToGitHubOrg(input.codeFiles, input.projectName);
    githubRepoFullName = githubResult.repoName;
    logStep('github_push', 'completed', undefined, {
      repoUrl: githubResult.repoUrl,
      repoName: githubResult.repoName,
    });

    // ========================================
    // Step 5: Create Vercel project + set env vars
    // ========================================
    logStep('vercel_create', 'running');
    const vercelResult = await vercel.createProject(
      sanitizeName(input.projectName),
      githubResult.repoName
    );
    vercelProjectId = vercelResult.projectId;

    // Generate a unique NEXTAUTH_SECRET for this project
    const nextauthSecret = generateSecret();

    // Inject all env vars
    const envVars: vercel.VercelEnvVar[] = [
      { key: 'DATABASE_URL', value: supabaseResult.databaseUrl, target: ['production', 'preview'], type: 'encrypted' },
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseResult.projectUrl, target: ['production', 'preview'], type: 'plain' },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: supabaseResult.anonKey, target: ['production', 'preview'], type: 'plain' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseResult.serviceRoleKey, target: ['production', 'preview'], type: 'encrypted' },
      { key: 'NEXTAUTH_SECRET', value: nextauthSecret, target: ['production', 'preview'], type: 'encrypted' },
      { key: 'STRIPE_CONNECT_ACCOUNT_ID', value: connectResult.accountId, target: ['production', 'preview'], type: 'encrypted' },
    ];

    // Add RESEND_API_KEY if available (ShipKit's key, shared across customer apps)
    if (process.env.RESEND_API_KEY) {
      envVars.push({ key: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY, target: ['production', 'preview'], type: 'encrypted' });
    }

    await vercel.setEnvVars(vercelResult.projectId, envVars);
    logStep('vercel_create', 'completed', undefined, {
      projectId: vercelResult.projectId,
      projectName: vercelResult.projectName,
    });

    // ========================================
    // Step 6: Trigger deployment + wait
    // ========================================
    logStep('vercel_deploy', 'running');
    const deployment = await vercel.triggerDeploy(
      vercelResult.projectName,
      githubResult.repoName
    );
    const productionUrl = await vercel.waitForDeployment(deployment.deploymentId);
    logStep('vercel_deploy', 'completed', undefined, {
      deploymentId: deployment.deploymentId,
      url: productionUrl,
    });

    // ========================================
    // Step 7: Verify live (HTTP 200 check)
    // ========================================
    logStep('verify_live', 'running');
    const verified = await verifyLive(productionUrl);
    logStep('verify_live', verified ? 'completed' : 'failed', verified ? undefined : 'Site did not return HTTP 200');

    // ========================================
    // Step 8: Create DeployedApp record
    // ========================================
    logStep('save_record', 'running');
    const deployedApp = await prisma.deployedApp.create({
      data: {
        projectId: input.projectId,
        supabaseProjectRef: supabaseResult.projectRef,
        supabaseProjectUrl: supabaseResult.projectUrl,
        supabaseDatabaseUrl: supabaseResult.databaseUrl,
        supabaseAnonKey: supabaseResult.anonKey,
        supabaseServiceKey: supabaseResult.serviceRoleKey,
        vercelProjectId: vercelResult.projectId,
        vercelProjectName: vercelResult.projectName,
        vercelProductionUrl: productionUrl,
        githubRepoFullName: githubResult.repoName,
        githubRepoUrl: githubResult.repoUrl,
        stripeConnectAccountId: connectResult.accountId,
        stripeConnectOnboarded: false,
        hostingStatus: 'ACTIVE',
        provisioningLog: JSON.parse(JSON.stringify(log)),
      },
    });

    // Update project record
    await prisma.project.update({
      where: { id: input.projectId },
      data: {
        githubRepoUrl: githubResult.repoUrl,
        githubRepoName: githubResult.repoName,
        vercelDeploymentUrl: productionUrl,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    logStep('save_record', 'completed');

    const totalTimeMs = Date.now() - startTime;
    console.log(`[Provisioning] Complete in ${(totalTimeMs / 1000).toFixed(1)}s: ${productionUrl}`);

    return {
      success: true,
      deployedAppId: deployedApp.id,
      productionUrl,
      githubRepoUrl: githubResult.repoUrl,
      stripeConnectOnboardingUrl: connectResult.onboardingUrl,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Provisioning] Pipeline failed:', errorMessage);

    // Save partial state
    try {
      await prisma.deployedApp.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          supabaseProjectRef: supabaseRef || null,
          vercelProjectId: vercelProjectId || null,
          githubRepoFullName: githubRepoFullName || null,
          hostingStatus: 'PROVISIONING',
          provisioningLog: JSON.parse(JSON.stringify(log)),
        },
        update: {
          provisioningLog: JSON.parse(JSON.stringify(log)),
        },
      });

      await prisma.project.update({
        where: { id: input.projectId },
        data: { status: 'FAILED' },
      });
    } catch (saveError) {
      console.error('[Provisioning] Failed to save error state:', saveError);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify a deployed site returns HTTP 200
 */
async function verifyLive(url: string, retries: number = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
      });
      if (response.ok) return true;
    } catch {
      // Retry
    }
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

function generateSecret(length: number = 48): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let secret = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    secret += chars[array[i] % chars.length];
  }
  return secret;
}

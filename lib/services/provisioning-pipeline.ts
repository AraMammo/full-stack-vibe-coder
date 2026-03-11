/**
 * Provisioning Pipeline
 *
 * The core orchestrator that ties all infrastructure services together.
 * Runs sequentially since each step depends on the previous.
 *
 * Flow:
 * 1. Create Neon project → DATABASE_URL
 * 2. Run database migrations → uses DATABASE_URL from step 1
 * 3. Create Stripe Connect Standard account → STRIPE_CONNECT_ACCOUNT_ID
 * 4. Push code to GitHub (ShipKit org) → GITHUB_REPO_URL
 * 5. Create Vercel project → inject all env vars from steps 1-3
 * 6. Trigger deployment → wait for READY
 * 7. Verify live (HTTP 200 check) → PRODUCTION_URL confirmed
 * 8. Create DeployedApp record → store all credentials
 */

import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { assertPipelineEnv } from '@/lib/env-check';
import * as neon from './neon-provisioning';
import * as vercel from './vercel-provisioning';
import * as stripeConnect from './stripe-connect';
import { pushToGitHubOrg, deleteGitHubRepo } from './claude-codegen';

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
  // Validate all required env vars before starting pipeline
  assertPipelineEnv();

  const log: ProvisioningLogEntry[] = [];
  const startTime = Date.now();

  const logStep = (step: string, status: ProvisioningLogEntry['status'], error?: string, data?: Record<string, unknown>) => {
    log.push({ step, status, timestamp: new Date().toISOString(), error, data });
    if (onProgress && status !== 'pending') {
      onProgress(step, status as 'running' | 'completed' | 'failed', data);
    }
  };

  // Track infrastructure state for compensating transactions on failure
  let neonProjectId: string | undefined;
  let vercelProjectId: string | undefined;
  let githubRepoFullName: string | undefined;
  let stripeConnectAccountId: string | undefined;

  try {
    // ========================================
    // Step 1: Create Neon project
    // ========================================
    logStep('neon_create', 'running');
    const neonResult = await neon.provisionProject(
      sanitizeName(input.projectName)
    );
    neonProjectId = neonResult.projectId;
    logStep('neon_create', 'completed', undefined, {
      projectId: neonResult.projectId,
      branchId: neonResult.branchId,
    });

    // ========================================
    // Step 2: Run database migrations
    // ========================================
    if (input.migrationSql) {
      logStep('database_migrate', 'running');
      await neon.runMigration(neonResult.databaseUrl, input.migrationSql);
      logStep('database_migrate', 'completed');
    } else {
      logStep('database_migrate', 'completed', undefined, { skipped: true });
    }

    // ========================================
    // Step 3: Create Stripe Connect Standard account
    // ========================================
    logStep('stripe_connect', 'running');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard/project/${input.projectId}`;
    const connectResult = await stripeConnect.provisionConnectAccount(
      input.userEmail,
      input.projectName,
      returnUrl
    );
    stripeConnectAccountId = connectResult.accountId;
    logStep('stripe_connect', 'completed', undefined, {
      accountId: connectResult.accountId,
      accountType: connectResult.accountType,
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

    // Inject all env vars — Neon uses a single DATABASE_URL (pooled)
    const envVars: vercel.VercelEnvVar[] = [
      { key: 'DATABASE_URL', value: neonResult.pooledUrl, target: ['production', 'preview'], type: 'encrypted' },
      { key: 'NEXTAUTH_SECRET', value: nextauthSecret, target: ['production', 'preview'], type: 'encrypted' },
      { key: 'STRIPE_CONNECT_ACCOUNT_ID', value: connectResult.accountId, target: ['production', 'preview'], type: 'encrypted' },
    ];

    // Add RESEND_API_KEY if available (ShipKit's key, shared across customer apps)
    if (process.env.RESEND_API_KEY) {
      envVars.push({ key: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY, target: ['production', 'preview'], type: 'encrypted' });
    }

    // Platform fee: inject ShipKit's Stripe key and fee percentage so generated apps
    // route payments through Stripe Connect with a 2% application fee
    if (process.env.STRIPE_SECRET_KEY) {
      envVars.push({ key: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY, target: ['production', 'preview'], type: 'encrypted' });
    }
    envVars.push({ key: 'NEXT_PUBLIC_PLATFORM_FEE_PERCENT', value: '2', target: ['production', 'preview'], type: 'plain' });

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
        neonProjectId: neonResult.projectId,
        neonBranchId: neonResult.branchId,
        neonDatabaseUrl: neonResult.databaseUrl,
        neonPooledUrl: neonResult.pooledUrl,
        vercelProjectId: vercelResult.projectId,
        vercelProjectName: vercelResult.projectName,
        vercelProductionUrl: productionUrl,
        githubRepoFullName: githubResult.repoName,
        githubRepoUrl: githubResult.repoUrl,
        stripeConnectAccountId: connectResult.accountId,
        stripeConnectAccountType: connectResult.accountType,
        stripeConnectOnboarded: false,
        stripeConnectOnboardingUrl: connectResult.onboardingUrl,
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
        productionUrl: productionUrl,
        status: 'LIVE',
        completedAt: new Date(),
      },
    });

    logStep('save_record', 'completed');

    // ========================================
    // Step 9: Create $49/mo hosting subscription (30-day trial)
    // ========================================
    logStep('hosting_subscription', 'running');
    try {
      const hostingPriceId = process.env.STRIPE_HOSTING_PRICE_ID;
      if (!hostingPriceId) {
        throw new Error('STRIPE_HOSTING_PRICE_ID not set');
      }

      // Look up the Stripe customer ID from the Payment record
      const payment = await prisma.payment.findFirst({
        where: { projectId: input.projectId },
        select: { stripeCustomerId: true },
      });

      let stripeCustomerId = payment?.stripeCustomerId;

      // If no customer exists yet, create one
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: input.userEmail,
          metadata: { projectId: input.projectId, userId: input.userId },
        });
        stripeCustomerId = customer.id;
      }

      // Create subscription with 30-day free trial
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: hostingPriceId }],
        trial_period_days: 30,
        metadata: {
          projectId: input.projectId,
          deployedAppId: deployedApp.id,
        },
      });

      // Save HostingSubscription record
      await prisma.hostingSubscription.create({
        data: {
          deployedAppId: deployedApp.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId,
          plan: 'STARTER',
          status: subscription.status,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });

      console.log(`[Provisioning] Hosting subscription created: ${subscription.id} (30-day trial)`);
      logStep('hosting_subscription', 'completed', undefined, {
        subscriptionId: subscription.id,
        trialEnd: new Date(subscription.trial_end! * 1000).toISOString(),
      });
    } catch (subError) {
      // Non-fatal — app is deployed, subscription can be created manually
      const subErrorMsg = subError instanceof Error ? subError.message : 'Unknown error';
      console.error('[Provisioning] Failed to create hosting subscription:', subErrorMsg);
      logStep('hosting_subscription', 'failed', subErrorMsg);
    }

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

    // ========================================
    // Compensating Transactions — tear down orphaned infrastructure
    // ========================================
    logStep('cleanup', 'running');
    const cleanupErrors: string[] = [];

    // Tear down in reverse order of creation
    if (vercelProjectId) {
      try {
        await vercel.deleteProject(vercelProjectId);
        console.log(`[Provisioning] Cleanup: deleted Vercel project ${vercelProjectId}`);
      } catch (e) {
        const msg = `Vercel cleanup failed: ${e instanceof Error ? e.message : e}`;
        console.error(`[Provisioning] ${msg}`);
        cleanupErrors.push(msg);
      }
    }

    if (githubRepoFullName) {
      try {
        await deleteGitHubRepo(githubRepoFullName);
        console.log(`[Provisioning] Cleanup: deleted GitHub repo ${githubRepoFullName}`);
      } catch (e) {
        const msg = `GitHub cleanup failed: ${e instanceof Error ? e.message : e}`;
        console.error(`[Provisioning] ${msg}`);
        cleanupErrors.push(msg);
      }
    }

    if (stripeConnectAccountId) {
      try {
        await stripeConnect.removeAccount(stripeConnectAccountId, 'standard');
        console.log(`[Provisioning] Cleanup: removed Stripe Connect account ${stripeConnectAccountId}`);
      } catch (e) {
        const msg = `Stripe Connect cleanup failed: ${e instanceof Error ? e.message : e}`;
        console.error(`[Provisioning] ${msg}`);
        cleanupErrors.push(msg);
      }
    }

    if (neonProjectId) {
      try {
        await neon.deleteProject(neonProjectId);
        console.log(`[Provisioning] Cleanup: deleted Neon project ${neonProjectId}`);
      } catch (e) {
        const msg = `Neon cleanup failed: ${e instanceof Error ? e.message : e}`;
        console.error(`[Provisioning] ${msg}`);
        cleanupErrors.push(msg);
      }
    }

    logStep('cleanup', cleanupErrors.length > 0 ? 'failed' : 'completed', cleanupErrors.join('; ') || undefined);

    // Save failure state to DB
    try {
      await prisma.deployedApp.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          hostingStatus: 'CANCELLED',
          provisioningLog: JSON.parse(JSON.stringify(log)),
        },
        update: {
          hostingStatus: 'CANCELLED',
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

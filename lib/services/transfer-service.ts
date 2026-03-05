/**
 * Transfer Service
 *
 * Orchestrates multi-service ownership transfer for deployed apps.
 * Transfers GitHub repo, Neon database, Vercel project, and disconnects Stripe Connect.
 *
 * Flow:
 * 1. GitHub — transfer repo to customer's account
 * 2. Neon — create transfer request (customer receives claim email)
 * 3. Vercel — delete ShipKit's project, provide re-import URL
 * 4. Stripe — disconnect Standard account (customer keeps everything)
 * 5. Cancel hosting subscription
 * 6. Set hostingStatus = TRANSFERRED
 */

import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { Octokit } from '@octokit/rest';
import * as neonProvisioning from './neon-provisioning';
import * as stripeConnect from './stripe-connect';
import * as vercel from './vercel-provisioning';

export interface TransferInput {
  deployedAppId: string;
  customerEmail: string;
  customerGithubUsername?: string;
}

export interface TransferResult {
  transferRequestId: string;
  githubTransferUrl?: string;
  neonClaimUrl?: string;
  vercelReimportUrl?: string;
}

export interface TransferStatusResult {
  status: string;
  githubTransferred: boolean;
  vercelTransferred: boolean;
  neonTransferred: boolean;
  stripeDisconnected: boolean;
  completedAt?: Date;
}

/**
 * Initiate full ownership transfer
 */
export async function initiateTransfer(input: TransferInput): Promise<TransferResult> {
  const deployedApp = await prisma.deployedApp.findUnique({
    where: { id: input.deployedAppId },
    include: {
      subscription: true,
      project: { select: { projectName: true, userId: true } },
    },
  });

  if (!deployedApp) {
    throw new Error('Deployed app not found');
  }

  if (deployedApp.hostingStatus === 'TRANSFERRED') {
    throw new Error('App already transferred');
  }

  if (deployedApp.hostingStatus === 'EJECTED') {
    throw new Error('App already ejected');
  }

  console.log(`[Transfer] Starting transfer for app ${input.deployedAppId}`);

  let githubTransferUrl: string | undefined;
  let neonClaimUrl: string | undefined;
  let vercelReimportUrl: string | undefined;
  let githubTransferred = false;
  let neonTransferred = false;
  let vercelTransferred = false;
  let stripeDisconnected = false;

  // Step 1: GitHub — transfer repo
  if (deployedApp.githubRepoFullName && input.customerGithubUsername) {
    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const [owner, repo] = deployedApp.githubRepoFullName.split('/');

      await octokit.repos.transfer({
        owner,
        repo,
        new_owner: input.customerGithubUsername,
      });

      githubTransferUrl = `https://github.com/${input.customerGithubUsername}/${repo}`;
      console.log(`[Transfer] GitHub repo transfer initiated → ${input.customerGithubUsername}`);
    } catch (error) {
      console.error('[Transfer] GitHub transfer failed:', error);
      // Non-fatal — continue with other transfers
    }
  }

  // Step 2: Neon — create transfer request
  if (deployedApp.neonProjectId) {
    try {
      neonClaimUrl = await neonProvisioning.createTransferRequest(
        deployedApp.neonProjectId,
        input.customerEmail
      );
      console.log(`[Transfer] Neon transfer request created for ${input.customerEmail}`);
    } catch (error) {
      console.error('[Transfer] Neon transfer request failed:', error);
    }
  }

  // Step 3: Vercel — delete project, provide re-import URL
  if (deployedApp.vercelProjectId) {
    try {
      await vercel.deleteProject(deployedApp.vercelProjectId);
      const repoUrl = deployedApp.githubRepoUrl || '';
      vercelReimportUrl = `https://vercel.com/new/import?s=${encodeURIComponent(repoUrl)}`;
      vercelTransferred = true;
      console.log(`[Transfer] Vercel project deleted, re-import URL generated`);
    } catch (error) {
      console.error('[Transfer] Vercel deletion failed:', error);
    }
  }

  // Step 4: Stripe — disconnect account
  if (deployedApp.stripeConnectAccountId) {
    try {
      await stripeConnect.removeAccount(
        deployedApp.stripeConnectAccountId,
        deployedApp.stripeConnectAccountType || 'standard'
      );
      stripeDisconnected = true;
      console.log(`[Transfer] Stripe Connect account disconnected`);
    } catch (error) {
      console.error('[Transfer] Stripe disconnect failed:', error);
    }
  }

  // Step 5: Cancel hosting subscription
  if (deployedApp.subscription?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(deployedApp.subscription.stripeSubscriptionId);
      await prisma.hostingSubscription.update({
        where: { id: deployedApp.subscription.id },
        data: { status: 'cancelled' },
      });
      console.log(`[Transfer] Hosting subscription cancelled`);
    } catch (error) {
      console.error('[Transfer] Subscription cancellation failed:', error);
    }
  }

  // Step 6: Create TransferRequest record and update hosting status
  const transferRequest = await prisma.transferRequest.create({
    data: {
      deployedAppId: input.deployedAppId,
      customerEmail: input.customerEmail,
      customerGithubUsername: input.customerGithubUsername,
      status: 'IN_PROGRESS',
      githubTransferred,
      vercelTransferred,
      neonTransferred,
      stripeDisconnected,
      githubTransferUrl,
      neonClaimUrl,
      vercelReimportUrl,
    },
  });

  await prisma.deployedApp.update({
    where: { id: input.deployedAppId },
    data: { hostingStatus: 'TRANSFERRED' },
  });

  console.log(`[Transfer] Transfer initiated: ${transferRequest.id}`);

  return {
    transferRequestId: transferRequest.id,
    githubTransferUrl,
    neonClaimUrl,
    vercelReimportUrl,
  };
}

/**
 * Check per-service transfer completion status
 */
export async function getTransferStatus(transferRequestId: string): Promise<TransferStatusResult> {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferRequestId },
    include: {
      deployedApp: {
        select: {
          githubRepoFullName: true,
          neonProjectId: true,
        },
      },
    },
  });

  if (!transfer) {
    throw new Error('Transfer request not found');
  }

  let { githubTransferred, neonTransferred } = transfer;

  // Check GitHub transfer status if not already confirmed
  if (!githubTransferred && transfer.customerGithubUsername && transfer.deployedApp.githubRepoFullName) {
    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const [, repo] = transfer.deployedApp.githubRepoFullName.split('/');
      await octokit.repos.get({
        owner: transfer.customerGithubUsername,
        repo,
      });
      githubTransferred = true;
    } catch {
      // Not transferred yet
    }
  }

  // Check if all services are complete
  const allComplete = githubTransferred && transfer.vercelTransferred && neonTransferred && transfer.stripeDisconnected;

  // Update if status changed
  if (githubTransferred !== transfer.githubTransferred || neonTransferred !== transfer.neonTransferred) {
    await prisma.transferRequest.update({
      where: { id: transferRequestId },
      data: {
        githubTransferred,
        neonTransferred,
        status: allComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: allComplete ? new Date() : undefined,
      },
    });
  }

  return {
    status: allComplete ? 'COMPLETED' : 'IN_PROGRESS',
    githubTransferred,
    vercelTransferred: transfer.vercelTransferred,
    neonTransferred,
    stripeDisconnected: transfer.stripeDisconnected,
    completedAt: allComplete ? new Date() : undefined,
  };
}

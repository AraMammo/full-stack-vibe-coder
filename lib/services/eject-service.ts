/**
 * Eject Service
 *
 * Allows customers to take their app off ShipKit infrastructure
 * and run it independently. Provides everything they need to self-host.
 *
 * Flow:
 * 1. Export database from Neon (before deleting)
 * 2. Cancel hosting subscription
 * 3. Disconnect/delete Stripe Connect account
 * 4. Delete Neon project
 * 5. Delete Vercel project
 * 6. Update DeployedApp status to EJECTED
 * 7. Return GitHub ZIP URL + database dump + migration guide
 */

import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import * as neon from './neon-provisioning';
import * as stripeConnect from './stripe-connect';
import * as vercel from './vercel-provisioning';

export interface EjectResult {
  success: boolean;
  downloadUrl: string;
  databaseDump?: string;
  error?: string;
}

/**
 * Full eject flow for a deployed app
 */
export async function ejectApp(deployedAppId: string): Promise<EjectResult> {
  const deployedApp = await prisma.deployedApp.findUnique({
    where: { id: deployedAppId },
    include: {
      subscription: true,
      project: { select: { name: true } },
    },
  });

  if (!deployedApp) {
    throw new Error('Deployed app not found');
  }

  if (deployedApp.hostingStatus === 'EJECTED') {
    throw new Error('App already ejected');
  }

  console.log(`[Eject] Starting eject for app ${deployedAppId}`);

  // Step 1: Export database (before deleting)
  let databaseDump: string | undefined;
  if (deployedApp.neonDatabaseUrl) {
    try {
      databaseDump = await neon.exportDatabase(deployedApp.neonDatabaseUrl);
      console.log(`[Eject] Database exported from Neon`);
    } catch (error) {
      console.error('[Eject] Failed to export database:', error);
      databaseDump = '-- Database export failed. Use prisma db push to recreate schema.';
    }
  }

  // Step 2: Cancel hosting subscription
  if (deployedApp.subscription?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(deployedApp.subscription.stripeSubscriptionId);
      await prisma.hostingSubscription.update({
        where: { id: deployedApp.subscription.id },
        data: { status: 'cancelled' },
      });
      console.log(`[Eject] Cancelled subscription: ${deployedApp.subscription.stripeSubscriptionId}`);
    } catch (error) {
      console.error('[Eject] Failed to cancel subscription:', error);
    }
  }

  // Step 3: Disconnect/delete Stripe Connect account
  if (deployedApp.stripeConnectAccountId) {
    try {
      await stripeConnect.removeAccount(
        deployedApp.stripeConnectAccountId,
        deployedApp.stripeConnectAccountType || 'express'
      );
      console.log(`[Eject] Stripe Connect account removed`);
    } catch (error) {
      console.error('[Eject] Failed to remove Stripe Connect account:', error);
    }
  }

  // Step 4: Delete Neon project
  if (deployedApp.neonProjectId) {
    try {
      await neon.deleteProject(deployedApp.neonProjectId);
      console.log(`[Eject] Neon project deleted`);
    } catch (error) {
      console.error('[Eject] Failed to delete Neon project:', error);
    }
  }

  // Step 5: Delete Vercel project
  if (deployedApp.vercelProjectId) {
    try {
      await vercel.deleteProject(deployedApp.vercelProjectId);
      console.log(`[Eject] Vercel project deleted`);
    } catch (error) {
      console.error('[Eject] Failed to delete Vercel project:', error);
    }
  }

  // Step 6: Update status to EJECTED
  await prisma.deployedApp.update({
    where: { id: deployedAppId },
    data: { hostingStatus: 'EJECTED' },
  });

  // Step 7: Provide download URL (GitHub repo ZIP)
  const downloadUrl = deployedApp.githubRepoUrl
    ? `${deployedApp.githubRepoUrl}/archive/refs/heads/main.zip`
    : '';

  console.log(`[Eject] App ejected successfully: ${deployedAppId}`);

  return {
    success: true,
    downloadUrl,
    databaseDump,
  };
}

/**
 * Generate a migration guide for self-hosting
 */
export function generateMigrationGuide(): string {
  return `# Migration Guide: Self-Hosting Your ShipKit App

## Overview

This guide walks you through running your app on your own infrastructure after ejecting from ShipKit.

## Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g., Neon, Railway, Supabase, or any PostgreSQL provider)
- A Vercel account (or other Node.js hosting)
- A Stripe account
- A domain name

## Step 1: Set Up Your Database

1. Create a PostgreSQL database on your preferred provider
2. Copy the connection string
3. Run the Prisma migrations:

\`\`\`bash
npm install
npx prisma db push
\`\`\`

## Step 2: Configure Environment Variables

1. Copy \`.env.example\` to \`.env.local\`
2. Fill in all required values (see comments in the file)

## Step 3: Configure Stripe

1. Go to https://dashboard.stripe.com
2. Get your API keys
3. Set up webhook endpoints pointing to your domain
4. Add the webhook secret to your env vars

## Step 4: Deploy

### Option A: Vercel (Recommended)

\`\`\`bash
npx vercel
\`\`\`

### Option B: Other hosting

\`\`\`bash
npm run build
npm start
\`\`\`

## Step 5: Set Up Custom Domain

Point your domain's DNS to your hosting provider.

## Step 6: Verify

1. Visit your domain
2. Test user registration
3. Test payment flow
4. Verify emails are sending

## Support

If you need help migrating, contact support@shipkit.io

---

Generated by ShipKit on ${new Date().toISOString()}
`;
}

/**
 * Generate .env.example with clear instructions
 */
export function generateEnvExample(): string {
  return `# ================================
# ShipKit App - Environment Variables
# ================================
# Copy this file to .env.local and fill in your values

# Database (PostgreSQL — any provider)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth.js
NEXTAUTH_SECRET="generate-a-secret-use-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# App URL
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
`;
}

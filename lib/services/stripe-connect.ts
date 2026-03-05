/**
 * Stripe Connect Service
 *
 * Manages Stripe Connect accounts for customer apps.
 * Standard accounts (new) allow clean disconnection and full customer ownership.
 * Express accounts (legacy) are kept for backward compatibility.
 *
 * Uses existing Stripe SDK from lib/stripe.ts.
 */

import { stripe } from '@/lib/stripe';

export interface ConnectAccountResult {
  accountId: string;
  accountType: 'standard' | 'express';
  onboardingUrl: string;
}

/**
 * Create a Stripe Connect Standard account for a customer.
 * Standard accounts give customers full dashboard access and can be cleanly disconnected.
 */
export async function createStandardAccount(
  email: string,
  businessName: string
): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'standard',
    email,
    business_profile: {
      name: businessName,
    },
  });

  console.log(`[Stripe Connect] Standard account created: ${account.id} for ${businessName}`);
  return account.id;
}

/**
 * @deprecated Use createStandardAccount() for new deployments.
 * Create a Stripe Connect Express account for a customer.
 */
export async function createExpressAccount(
  email: string,
  businessName: string
): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    business_profile: {
      name: businessName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  console.log(`[Stripe Connect] Express account created: ${account.id} for ${businessName}`);
  return account.id;
}

/**
 * Create an onboarding link for a Connect account
 */
export async function createOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl?: string
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    return_url: returnUrl,
    refresh_url: refreshUrl || returnUrl,
  });

  console.log(`[Stripe Connect] Onboarding link created for ${accountId}`);
  return accountLink.url;
}

/**
 * Get the status of a Connect account
 */
export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: string[];
}> {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requirements: account.requirements?.currently_due || [],
  };
}

/**
 * Create a dashboard link for a Connect account.
 * Standard accounts use the Stripe dashboard directly.
 * Express accounts use the login link API.
 */
export async function createDashboardLink(
  accountId: string,
  accountType: string = 'standard'
): Promise<string> {
  if (accountType === 'standard') {
    return 'https://dashboard.stripe.com';
  }
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

/**
 * Disconnect a Standard account (customer keeps everything — customers, subscriptions, etc.)
 */
export async function disconnectAccount(accountId: string): Promise<void> {
  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    throw new Error('STRIPE_CLIENT_ID not set — required for OAuth deauthorization');
  }

  await stripe.oauth.deauthorize({
    client_id: clientId,
    stripe_user_id: accountId,
  });

  console.log(`[Stripe Connect] Standard account disconnected: ${accountId}`);
}

/**
 * @deprecated Use removeAccount() which is type-aware.
 * Delete (close) a Stripe Connect Express account.
 */
export async function deleteExpressAccount(accountId: string): Promise<void> {
  await stripe.accounts.del(accountId);
  console.log(`[Stripe Connect] Express account deleted: ${accountId}`);
}

/**
 * Remove a Connect account — type-aware.
 * Standard → disconnect (customer keeps everything)
 * Express → delete (account is closed)
 */
export async function removeAccount(
  accountId: string,
  accountType: string = 'standard'
): Promise<void> {
  if (accountType === 'standard') {
    await disconnectAccount(accountId);
  } else {
    await deleteExpressAccount(accountId);
  }
}

/**
 * Full flow: create Standard account + generate onboarding link
 */
export async function provisionConnectAccount(
  email: string,
  businessName: string,
  returnUrl: string
): Promise<ConnectAccountResult> {
  const accountId = await createStandardAccount(email, businessName);
  const onboardingUrl = await createOnboardingLink(accountId, returnUrl);

  return { accountId, accountType: 'standard', onboardingUrl };
}

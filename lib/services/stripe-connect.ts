/**
 * Stripe Connect Service
 *
 * Manages Stripe Connect Express accounts for customer apps.
 * Enables customers to accept payments through their deployed apps.
 *
 * Uses existing Stripe SDK from lib/stripe.ts.
 */

import { stripe } from '@/lib/stripe';

export interface ConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
}

/**
 * Create a Stripe Connect Express account for a customer
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

  console.log(`[Stripe Connect] Account created: ${account.id} for ${businessName}`);
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
 * Create a login link for an existing Connect account dashboard
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

/**
 * Full flow: create account + generate onboarding link
 */
export async function provisionConnectAccount(
  email: string,
  businessName: string,
  returnUrl: string
): Promise<ConnectAccountResult> {
  const accountId = await createExpressAccount(email, businessName);
  const onboardingUrl = await createOnboardingLink(accountId, returnUrl);

  return { accountId, onboardingUrl };
}

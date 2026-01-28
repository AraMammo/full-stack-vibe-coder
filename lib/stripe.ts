/**
 * Stripe Client Configuration
 *
 * Centralized Stripe client with environment-aware key switching.
 * Uses test keys in development, live keys in production.
 */

import Stripe from 'stripe';

// ============================================
// ENVIRONMENT-AWARE KEY SELECTION
// ============================================

const isProduction = process.env.NODE_ENV === 'production';

// Use test keys in development if available, otherwise fall back to live keys
const stripeSecretKey = isProduction
  ? process.env.STRIPE_SECRET_KEY!
  : (process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY!);

const stripeWebhookSecret = isProduction
  ? process.env.STRIPE_WEBHOOK_SECRET!
  : (process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET!);

// Publishable key for client-side (if needed)
export const stripePublishableKey = isProduction
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
  : (process.env.STRIPE_PUBLISHABLE_TEST_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ============================================
// STRIPE CLIENT
// ============================================

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
});

export const webhookSecret = stripeWebhookSecret;

// Log which mode we're using (only on server startup)
if (typeof window === 'undefined') {
  const mode = stripeSecretKey?.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  console.log(`[Stripe] Initialized in ${mode} mode (${isProduction ? 'production' : 'development'} environment)`);
}

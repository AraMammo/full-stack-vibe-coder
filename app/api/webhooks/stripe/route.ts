/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (checkout.session.completed, etc.)
 *
 * CRITICAL: This is the ONLY place where payment/project records are created.
 * The /api/payment/verify endpoint only reads - it does not create.
 * This prevents race conditions between webhook and verify endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { db } from '@/server/db';
import { toolPurchases } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { stripe, webhookSecret } from '@/lib/stripe';

// ============================================
// WEBHOOK HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        console.log('[Stripe Webhook] Payment intent succeeded (handled by checkout.session.completed)');
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        console.log('[Stripe Webhook] Subscription payment failed - will be handled by customer.subscription.deleted if cancelled');
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  console.log(`[Stripe Webhook] Processing checkout.session.completed: ${session.id}`);

  try {
    // Validate session has metadata object
    if (!session.metadata || typeof session.metadata !== 'object') {
      console.error('[Stripe Webhook] Session missing metadata object');
      throw new Error('Session missing metadata');
    }

    // Check if this is a tool purchase or BIAB purchase
    const toolId = session.metadata.toolId;
    const accessType = session.metadata.accessType;

    // Validate accessType if present
    const validAccessTypes = ['monthly', 'annual', 'lifetime'] as const;
    if (toolId && accessType) {
      if (!validAccessTypes.includes(accessType as typeof validAccessTypes[number])) {
        console.error('[Stripe Webhook] Invalid accessType:', accessType);
        throw new Error(`Invalid accessType: ${accessType}`);
      }
      // Handle tool purchase
      await handleToolPurchase(session, toolId, accessType as 'monthly' | 'annual' | 'lifetime');
      return;
    }

    // Handle BIAB purchase
    const tier = session.metadata.tier;
    const validTiers = ['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM'] as const;

    if (tier && !validTiers.includes(tier as typeof validTiers[number])) {
      console.error('[Stripe Webhook] Invalid tier:', tier);
      throw new Error(`Invalid tier: ${tier}`);
    }

    const userEmail = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total || 0;

    if (!tier || !userEmail) {
      console.error('[Stripe Webhook] Missing required metadata:', { tier, userEmail });
      throw new Error('Missing tier or userEmail in session metadata');
    }

    const validatedTier = tier as 'VALIDATION_PACK' | 'LAUNCH_BLUEPRINT' | 'TURNKEY_SYSTEM';

    // Use transaction to ensure atomic creation of user, project, and payment
    // This prevents race conditions and ensures data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if payment already exists (idempotency check)
      const existingPayment = await tx.payment.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (existingPayment) {
        console.log(`[Stripe Webhook] Payment already exists: ${existingPayment.id} (idempotent)`);
        // Return existing data for idempotent response
        const existingProject = existingPayment.projectId
          ? await tx.project.findUnique({ where: { id: existingPayment.projectId } })
          : null;
        return { payment: existingPayment, project: existingProject, isNew: false };
      }

      // Find or create user (upsert pattern to handle race conditions)
      let user = await tx.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        console.log(`[Stripe Webhook] Creating new user: ${userEmail}`);
        user = await tx.user.create({
          data: {
            email: userEmail,
            name: session.customer_details?.name || null,
          },
        });
        console.log(`[Stripe Webhook] ✓ User created: ${user.id}`);
      }

      // Create project record
      const project = await tx.project.create({
        data: {
          userId: user.id,
          projectName: `Business in a Box - ${validatedTier.replace(/_/g, ' ')}`,
          biabTier: validatedTier,
          businessConcept: '', // Will be populated when execution starts
          status: 'PENDING',
        },
      });

      console.log(`[Stripe Webhook] ✓ Project created: ${project.id}`);

      // Create payment record (linked to project)
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          userEmail,
          tier: validatedTier,
          amount,
          currency: session.currency || 'usd',
          status: session.payment_status === 'paid' ? 'COMPLETED' : 'PROCESSING',
          stripeSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          projectId: project.id,
          metadata: session.metadata || {},
          completedAt: session.payment_status === 'paid' ? new Date() : null,
        },
      });

      console.log(`[Stripe Webhook] ✓ Payment created: ${payment.id} ($${amount / 100} ${validatedTier})`);

      return { user, project, payment, isNew: true };
    });

    // If this was a duplicate webhook (idempotent), skip execution
    if (!result.isNew) {
      console.log(`[Stripe Webhook] Skipping BIAB execution (duplicate webhook)`);
      return;
    }

    const { user, project, payment } = result as { user: { id: string; email: string | null }; project: { id: string }; payment: { id: string }; isNew: true };

    // Trigger BIAB execution
    // NOTE: We await this but don't fail the webhook if execution fails.
    // The payment is already recorded, and execution can be retried.
    console.log(`[Stripe Webhook] 🚀 Triggering BIAB execution for project: ${project.id}`);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const executionResponse = await fetch(`${baseUrl}/api/business-in-a-box/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          businessConcept: `Business concept for ${validatedTier.replace(/_/g, ' ')}`,
          userId: user.id,
          tier: validatedTier,
        }),
      });

      if (!executionResponse.ok) {
        const errorText = await executionResponse.text().catch(() => 'Unknown error');
        console.error(`[Stripe Webhook] ⚠️ BIAB execution failed (${executionResponse.status}):`, errorText);

        // Update project status to indicate execution needs retry
        await prisma.project.update({
          where: { id: project.id },
          data: {
            status: 'PENDING', // Keep pending so it can be retried
            // Store error info for debugging
          },
        });
      } else {
        console.log(`[Stripe Webhook] ✓ BIAB execution triggered successfully`);
      }
    } catch (execError: any) {
      console.error('[Stripe Webhook] ⚠️ Error triggering BIAB execution:', execError.message);

      // Update project status to indicate execution needs retry
      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: 'PENDING', // Keep pending so it can be retried
        },
      });

      // Don't throw - payment is already complete, execution can be retried
      // The /api/payment/verify endpoint will show the project exists but is pending
    }

  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process checkout.session.completed:', error);
    throw error; // Re-throw to return 500 and trigger Stripe retry
  }
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`[Stripe Webhook] Processing payment_intent.payment_failed: ${paymentIntent.id}`);

  try {
    // Find payment by payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.log(`[Stripe Webhook] No payment found for failed intent: ${paymentIntent.id}`);
      return;
    }

    // Safely merge existing metadata with failure reason
    const existingMetadata = (payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata))
      ? payment.metadata as Record<string, unknown>
      : {};

    // Update payment status to FAILED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...existingMetadata,
          failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
        },
      },
    });

    // Also update associated project if exists
    if (payment.projectId) {
      await prisma.project.update({
        where: { id: payment.projectId },
        data: { status: 'FAILED' },
      });
    }

    console.log(`[Stripe Webhook] ✓ Payment marked as failed: ${payment.id}`);

  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process payment_intent.payment_failed:', error);
    throw error;
  }
}

/**
 * Handle tool purchase (Substack Engine, Reaction Video, etc.)
 */
async function handleToolPurchase(
  session: Stripe.Checkout.Session,
  toolId: string,
  accessType: 'monthly' | 'annual' | 'lifetime'
) {
  const userEmail = session.metadata?.email || session.customer_email || session.customer_details?.email;

  if (!userEmail) {
    console.error('[Stripe Webhook] Missing email for tool purchase');
    throw new Error('Missing email for tool purchase');
  }

  console.log(`[Stripe Webhook] Processing tool purchase: ${toolId} (${accessType}) for ${userEmail}`);

  // Check for existing purchase (idempotency)
  const existingPurchase = await db.select()
    .from(toolPurchases)
    .where(eq(toolPurchases.stripePaymentIntentId, session.payment_intent as string))
    .limit(1);

  if (existingPurchase.length > 0) {
    console.log(`[Stripe Webhook] Tool purchase already exists (idempotent)`);
    return;
  }

  // Calculate expiration date
  let expiresAt: Date | null = null;
  if (accessType === 'monthly') {
    expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else if (accessType === 'annual') {
    expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  // lifetime = null expiration (never expires)

  // Get subscription ID if this is a subscription checkout
  const subscriptionId = session.subscription as string | null;

  // Create tool purchase record
  await db.insert(toolPurchases).values({
    email: userEmail.toLowerCase(),
    toolName: toolId,
    accessType: accessType,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
    stripeSubscriptionId: subscriptionId,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    status: 'active',
    expiresAt: expiresAt,
  });

  console.log(`[Stripe Webhook] ✓ Tool purchase recorded: ${toolId} for ${userEmail}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Processing subscription cancellation: ${subscription.id}`);

  try {
    // Find and deactivate the tool purchase by subscription ID
    await db
      .update(toolPurchases)
      .set({ status: 'cancelled' })
      .where(eq(toolPurchases.stripeSubscriptionId, subscription.id));

    console.log(`[Stripe Webhook] ✓ Subscription ${subscription.id} marked as cancelled`);
  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process subscription cancellation:', error);
    throw error;
  }
}

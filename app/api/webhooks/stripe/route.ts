/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (checkout.session.completed, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { db } from '@/server/db';
import { toolPurchases } from '@/shared/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
    // Check if this is a tool purchase or BIAB purchase
    const toolId = session.metadata?.toolId;
    const accessType = session.metadata?.accessType as 'monthly' | 'annual' | 'lifetime' | undefined;

    if (toolId && accessType) {
      // Handle tool purchase
      await handleToolPurchase(session, toolId, accessType);
      return;
    }

    // Handle BIAB purchase
    const tier = session.metadata?.tier as 'VALIDATION_PACK' | 'LAUNCH_BLUEPRINT' | 'TURNKEY_SYSTEM';
    const userEmail = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total || 0;

    if (!tier || !userEmail) {
      console.error('[Stripe Webhook] Missing required metadata:', { tier, userEmail });
      throw new Error('Missing tier or userEmail in session metadata');
    }

    // Look up user by email
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    // If user doesn't exist, create one (fallback, though they should already exist from sign-in)
    if (!user) {
      console.log(`[Stripe Webhook] User not found, creating new user: ${userEmail}`);
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: session.customer_details?.name || null,
        },
      });
      console.log(`[Stripe Webhook] ✓ User created: ${user.id}`);
    }

    // Check if payment already exists (idempotency)
    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (existingPayment) {
      console.log(`[Stripe Webhook] Payment already exists: ${existingPayment.id}`);
      return;
    }

    // Create project record
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        projectName: `Business in a Box - ${tier.replace('_', ' ')}`,
        biabTier: tier,
        businessConcept: '', // Will be populated when execution starts
        status: 'PENDING',
      },
    });

    console.log(`[Stripe Webhook] ✓ Project created: ${project.id}`);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        userEmail,
        tier,
        amount,
        currency: session.currency || 'usd',
        status: session.payment_status === 'paid' ? 'COMPLETED' : 'PROCESSING',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string | null,
        stripeCustomerId: session.customer as string | null,
        projectId: project.id,
        metadata: session.metadata || {},
        completedAt: session.payment_status === 'paid' ? new Date() : null,
      },
    });

    console.log(`[Stripe Webhook] ✓ Payment created: ${payment.id} ($${amount / 100} ${tier})`);

    // Trigger BIAB execution
    console.log(`[Stripe Webhook] 🚀 Triggering BIAB execution for project: ${project.id}`);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const executionResponse = await fetch(`${baseUrl}/api/business-in-a-box/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          businessConcept: `Business concept for ${tier.replace('_', ' ')}`,
          userId: user.id,
          tier: tier,
        }),
      });

      if (!executionResponse.ok) {
        const errorData = await executionResponse.json();
        console.error('[Stripe Webhook] ⚠️  Failed to trigger BIAB execution:', errorData);
        // Don't throw - payment is already complete, execution can be retried manually
      } else {
        console.log(`[Stripe Webhook] ✓ BIAB execution triggered successfully`);
      }
    } catch (execError: any) {
      console.error('[Stripe Webhook] ⚠️  Error triggering BIAB execution:', execError.message);
      // Don't throw - payment is already complete, execution can be retried manually
    }

    // TODO: Send confirmation email via SendGrid with project ID and next steps
    // await sendPaymentConfirmationEmail({
    //   email: userEmail,
    //   tier,
    //   amount,
    //   paymentId: payment.id,
    //   projectId: project.id,
    // });

  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process checkout.session.completed:', error);
    throw error;
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

    // Update payment status to FAILED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...(payment.metadata as any),
          failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
        },
      },
    });

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
    stripeCustomerId: session.customer as string | null,
    stripeSubscriptionId: subscriptionId,
    stripePaymentIntentId: session.payment_intent as string | null,
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
    const { toolPurchases: toolPurchasesTable } = await import('@/shared/schema');
    const { eq } = await import('drizzle-orm');

    await db
      .update(toolPurchasesTable)
      .set({ status: 'cancelled' })
      .where(eq(toolPurchasesTable.stripeSubscriptionId, subscription.id));

    console.log(`[Stripe Webhook] ✓ Subscription ${subscription.id} marked as cancelled`);
  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process subscription cancellation:', error);
    throw error;
  }
}

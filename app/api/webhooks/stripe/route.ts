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

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
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

    // Handle ShipKit purchase
    const tier = session.metadata.tier;
    const chatSessionId = session.metadata.sessionId; // From chat analysis
    const validTiers = ['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM', 'PRESENCE'] as const;

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

    const validatedTier = tier as 'VALIDATION_PACK' | 'LAUNCH_BLUEPRINT' | 'TURNKEY_SYSTEM' | 'PRESENCE';

    // Look up business concept from chat_submissions if sessionId provided
    let businessConcept = '';
    if (chatSessionId) {
      try {
        const chatSubmission = await prisma.chat_submissions.findUnique({
          where: { session_id: chatSessionId },
        });
        if (chatSubmission) {
          businessConcept = chatSubmission.user_input;
          console.log(`[Stripe Webhook] Found chat submission for sessionId: ${chatSessionId}`);
        }
      } catch (lookupError) {
        console.error('[Stripe Webhook] Failed to look up chat submission:', lookupError);
      }
    }

    const tierDisplayNames: Record<string, string> = {
      VALIDATION_PACK: 'ShipKit Lite',
      LAUNCH_BLUEPRINT: 'ShipKit Pro',
      TURNKEY_SYSTEM: 'ShipKit Complete',
      PRESENCE: 'ShipKit Presence',
    };

    // Use transaction to ensure atomic creation of user, project, and payment
    const result = await prisma.$transaction(async (tx) => {
      // Check if payment already exists (idempotency check)
      const existingPayment = await tx.payment.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (existingPayment) {
        console.log(`[Stripe Webhook] Payment already exists: ${existingPayment.id} (idempotent)`);
        const existingProject = existingPayment.projectId
          ? await tx.project.findUnique({ where: { id: existingPayment.projectId } })
          : null;
        return { payment: existingPayment, project: existingProject, isNew: false };
      }

      // Find or create user
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
          projectName: tierDisplayNames[validatedTier] || 'ShipKit',
          biabTier: validatedTier,
          productType: validatedTier === 'PRESENCE' ? 'PRESENCE' : 'BUILDER',
          businessConcept,
          status: 'PENDING',
        },
      });

      console.log(`[Stripe Webhook] ✓ Project created: ${project.id}`);

      // Create payment record
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

    // Trigger ShipKit orchestrator
    // NOTE: We await this but don't fail the webhook if execution fails.
    // The payment is already recorded, and execution can be retried.
    console.log(`[Stripe Webhook] Triggering ShipKit orchestrator for project: ${project.id}`);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const executionResponse = await fetch(`${baseUrl}/api/shipkit/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          businessConcept: businessConcept || `Business concept for ${tierDisplayNames[validatedTier]}`,
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
 * Handle subscription cancellation (both tool purchases and hosting subscriptions)
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Processing subscription cancellation: ${subscription.id}`);

  try {
    // Check if this is a hosting subscription
    const hostingSub = await prisma.hostingSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { deployedApp: true },
    });

    if (hostingSub) {
      await prisma.hostingSubscription.update({
        where: { id: hostingSub.id },
        data: { status: 'cancelled' },
      });
      await prisma.deployedApp.update({
        where: { id: hostingSub.deployedAppId },
        data: { hostingStatus: 'CANCELLED' },
      });
      console.log(`[Stripe Webhook] Hosting subscription ${subscription.id} cancelled`);
      return;
    }

    // Otherwise handle as tool purchase
    await db
      .update(toolPurchases)
      .set({ status: 'cancelled' })
      .where(eq(toolPurchases.stripeSubscriptionId, subscription.id));

    console.log(`[Stripe Webhook] Subscription ${subscription.id} marked as cancelled`);
  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process subscription cancellation:', error);
    throw error;
  }
}

/**
 * Handle subscription updates (status changes, renewals)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Processing subscription update: ${subscription.id}`);

  try {
    const hostingSub = await prisma.hostingSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!hostingSub) {
      console.log(`[Stripe Webhook] No hosting subscription found for ${subscription.id}`);
      return;
    }

    // Detect plan changes based on the current Stripe price
    const currentPriceId = subscription.items.data[0]?.price?.id;
    let plan: string | undefined;
    if (currentPriceId) {
      if (currentPriceId === process.env.STRIPE_HOSTING_PRICE_ID) plan = 'STARTER';
      else if (currentPriceId === process.env.STRIPE_HOSTING_GROWTH_PRICE_ID) plan = 'GROWTH';
      else if (currentPriceId === process.env.STRIPE_HOSTING_SCALE_PRICE_ID) plan = 'SCALE';
    }

    await prisma.hostingSubscription.update({
      where: { id: hostingSub.id },
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        ...(plan ? { plan: plan as any } : {}),
      },
    });

    console.log(`[Stripe Webhook] Hosting subscription updated: ${subscription.status}${plan ? ` (plan: ${plan})` : ''}`);
  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to update subscription:', error);
    throw error;
  }
}

/**
 * Handle failed invoice payment — suspend the hosted app
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const sub = (invoice as any).subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id;

  if (!subscriptionId) return;

  console.log(`[Stripe Webhook] Invoice payment failed for subscription: ${subscriptionId}`);

  try {
    const hostingSub = await prisma.hostingSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!hostingSub) return;

    await prisma.deployedApp.update({
      where: { id: hostingSub.deployedAppId },
      data: { hostingStatus: 'SUSPENDED' },
    });

    console.log(`[Stripe Webhook] App suspended due to failed payment`);
  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to handle invoice.payment_failed:', error);
  }
}

/**
 * Handle successful invoice payment — reactivate suspended app
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const sub = (invoice as any).subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id;

  if (!subscriptionId) return;

  try {
    const hostingSub = await prisma.hostingSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      include: { deployedApp: true },
    });

    if (!hostingSub) return;

    // Only reactivate if currently suspended
    if (hostingSub.deployedApp.hostingStatus === 'SUSPENDED') {
      await prisma.deployedApp.update({
        where: { id: hostingSub.deployedAppId },
        data: { hostingStatus: 'ACTIVE' },
      });
      console.log(`[Stripe Webhook] App reactivated after payment`);
    }
  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to handle invoice.paid:', error);
  }
}

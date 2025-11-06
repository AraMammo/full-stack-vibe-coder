/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (checkout.session.completed, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@/app/generated/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ============================================
// WEBHOOK HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, prisma);
        break;

      case 'payment_intent.succeeded':
        console.log('[Stripe Webhook] Payment intent succeeded (handled by checkout.session.completed)');
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, prisma);
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
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  prisma: PrismaClient
) {
  console.log(`[Stripe Webhook] Processing checkout.session.completed: ${session.id}`);

  try {
    // Extract metadata
    const tier = session.metadata?.tier as 'VALIDATION_PACK' | 'LAUNCH_BLUEPRINT' | 'TURNKEY_SYSTEM';
    const userEmail = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total || 0;

    if (!tier || !userEmail) {
      console.error('[Stripe Webhook] Missing required metadata:', { tier, userEmail });
      throw new Error('Missing tier or userEmail in session metadata');
    }

    // Check if payment already exists (idempotency)
    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (existingPayment) {
      console.log(`[Stripe Webhook] Payment already exists: ${existingPayment.id}`);
      return;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: userEmail, // Use email as userId (can link to auth later)
        userEmail,
        tier,
        amount,
        currency: session.currency || 'usd',
        status: session.payment_status === 'paid' ? 'COMPLETED' : 'PROCESSING',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string | null,
        stripeCustomerId: session.customer as string | null,
        metadata: session.metadata || {},
        completedAt: session.payment_status === 'paid' ? new Date() : null,
      },
    });

    console.log(`[Stripe Webhook] ✓ Payment created: ${payment.id} ($${amount / 100} ${tier})`);

    // TODO: Send confirmation email via Postmark
    // await sendPaymentConfirmationEmail({
    //   email: userEmail,
    //   tier,
    //   amount,
    //   paymentId: payment.id,
    // });

  } catch (error: any) {
    console.error('[Stripe Webhook] Failed to process checkout.session.completed:', error);
    throw error;
  }
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  prisma: PrismaClient
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

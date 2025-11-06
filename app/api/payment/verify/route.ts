/**
 * Payment Verification API
 *
 * GET /api/payment/verify?session_id=xxx
 * Verifies Stripe checkout session and returns payment details
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@/app/generated/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// ============================================
// TIER DISPLAY NAMES
// ============================================

const TIER_DISPLAY_NAMES: Record<string, string> = {
  VALIDATION_PACK: 'Validation Pack',
  LAUNCH_BLUEPRINT: 'Launch Blueprint',
  TURNKEY_SYSTEM: 'Turnkey System',
};

// ============================================
// GET HANDLER
// ============================================

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    console.log(`[Payment Verify] Verifying session: ${sessionId}`);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      );
    }

    // Extract metadata
    const tier = session.metadata?.tier;
    const email = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total || 0;

    if (!tier || !email) {
      return NextResponse.json(
        { error: 'Missing payment metadata' },
        { status: 400 }
      );
    }

    console.log(`[Payment Verify] ✓ Payment verified: ${tier} for ${email}`);

    // Check if payment exists in database
    let payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    // If webhook hasn't processed yet, create payment record
    if (!payment) {
      console.log('[Payment Verify] Payment not in DB yet, creating record...');
      payment = await prisma.payment.create({
        data: {
          userId: email,
          userEmail: email,
          tier: tier as any,
          amount,
          currency: session.currency || 'usd',
          status: 'COMPLETED',
          stripeSessionId: sessionId,
          stripePaymentIntentId: session.payment_intent as string | null,
          stripeCustomerId: session.customer as string | null,
          metadata: session.metadata || {},
          completedAt: new Date(),
        },
      });
      console.log(`[Payment Verify] ✓ Payment record created: ${payment.id}`);
    }

    // Return payment info
    return NextResponse.json({
      tier,
      tierName: TIER_DISPLAY_NAMES[tier] || tier,
      amount,
      email,
      paymentId: payment.id,
      status: 'completed',
    });

  } catch (error: any) {
    console.error('[Payment Verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

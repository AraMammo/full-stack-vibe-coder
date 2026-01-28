/**
 * Payment Verification API
 *
 * GET /api/payment/verify?session_id=xxx
 * Verifies Stripe checkout session and returns payment details
 *
 * IMPORTANT: This endpoint only READS payment status.
 * Payment/project creation is handled by the Stripe webhook.
 * This prevents race conditions between verify and webhook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

// ============================================
// TIER DISPLAY NAMES
// ============================================

const TIER_DISPLAY_NAMES: Record<string, string> = {
  VALIDATION_PACK: 'Validation Pack',
  LAUNCH_BLUEPRINT: 'Launch Blueprint',
  TURNKEY_SYSTEM: 'Turnkey System',
};

// ============================================
// RETRY CONFIGURATION
// ============================================

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1000; // 1 second between retries

/**
 * Wait for payment to be processed by webhook
 * Returns payment record or null if timeout
 */
async function waitForPayment(sessionId: string, maxRetries: number = MAX_RETRIES): Promise<{
  payment: Awaited<ReturnType<typeof prisma.payment.findUnique>>;
  project: Awaited<ReturnType<typeof prisma.project.findFirst>>;
} | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (payment) {
      // Also fetch the associated project
      const project = payment.projectId
        ? await prisma.project.findUnique({ where: { id: payment.projectId } })
        : await prisma.project.findFirst({
            where: { userId: payment.userId },
            orderBy: { createdAt: 'desc' },
          });

      return { payment, project };
    }

    // Wait before next attempt
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return null;
}

// ============================================
// GET HANDLER
// ============================================

export async function GET(request: NextRequest) {
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

    // Retrieve session from Stripe to verify payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check payment status with Stripe
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      );
    }

    // Extract metadata for response
    const tier = session.metadata?.tier;
    const email = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total || 0;

    if (!tier || !email) {
      return NextResponse.json(
        { error: 'Missing payment metadata' },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = ['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM'] as const;
    if (!validTiers.includes(tier as typeof validTiers[number])) {
      console.error(`[Payment Verify] Invalid tier: ${tier}`);
      return NextResponse.json(
        { error: 'Invalid tier in payment metadata' },
        { status: 400 }
      );
    }

    console.log(`[Payment Verify] Stripe confirms payment: ${tier} for ${email}`);

    // Wait for webhook to process and create payment record
    // This prevents race condition where verify creates payment before webhook
    const result = await waitForPayment(sessionId);

    if (!result) {
      // Webhook hasn't processed yet after max retries
      // Return 202 Accepted to indicate payment is valid but still processing
      console.log(`[Payment Verify] Payment not yet in DB, returning processing status`);
      return NextResponse.json(
        {
          status: 'processing',
          message: 'Payment confirmed, setting up your project. Please wait...',
          tier,
          tierName: TIER_DISPLAY_NAMES[tier] || tier,
          amount,
          email,
        },
        { status: 202 }
      );
    }

    const { payment, project } = result;

    if (!payment) {
      // This shouldn't happen given our logic, but TypeScript needs the check
      console.error('[Payment Verify] Unexpected null payment in result');
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 500 }
      );
    }

    console.log(`[Payment Verify] ✓ Payment verified: ${payment.id}, Project: ${project?.id || 'N/A'}`);

    // Return complete payment info
    return NextResponse.json({
      status: 'completed',
      tier,
      tierName: TIER_DISPLAY_NAMES[tier] || tier,
      amount,
      email,
      paymentId: payment.id,
      projectId: project?.id || null,
      projectStatus: project?.status || null,
    });

  } catch (error: any) {
    console.error('[Payment Verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Payment Verification API
 *
 * GET /api/payment/verify?session_id=cs_xxx
 * Looks up a Stripe checkout session and returns payment + project info.
 * Read-only — does not create records (that's the webhook's job).
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Look up our payment record (webhook should have created it)
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: { project: true },
    });

    const tier = session.metadata?.tier || 'TURNKEY_SYSTEM';
    const tierNames: Record<string, string> = {
      VALIDATION_PACK: 'Full Stack Vibe Coder Lite',
      LAUNCH_BLUEPRINT: 'Full Stack Vibe Coder Pro',
      TURNKEY_SYSTEM: 'Full Stack Vibe Coder Complete',
      PRESENCE: 'Full Stack Vibe Coder Presence',
    };

    return NextResponse.json({
      tier,
      tierName: tierNames[tier] || tier,
      amount: session.amount_total || 0,
      email: session.customer_email || session.customer_details?.email || '',
      projectName: payment?.project?.name || session.metadata?.businessName || null,
      projectId: payment?.projectId || session.metadata?.projectId || null,
    });

  } catch (error) {
    console.error('[Payment Verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

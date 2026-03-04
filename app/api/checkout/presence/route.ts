/**
 * Presence Checkout API
 *
 * POST /api/checkout/presence
 * Creates a Stripe checkout session for ShipKit Presence ($97 static site).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const PresenceCheckoutSchema = z.object({
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = PresenceCheckoutSchema.parse(body);

    // Auth required
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const priceId = process.env.STRIPE_PRESENCE_PRICE_ID;
    if (!priceId) {
      console.error('[Presence Checkout] STRIPE_PRESENCE_PRICE_ID not set');
      return NextResponse.json(
        { error: 'Presence product not configured' },
        { status: 500 }
      );
    }

    console.log(`[Presence Checkout] Creating checkout for user: ${authSession.user.id}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      customer_email: authSession.user.email || undefined,
      metadata: {
        tier: 'PRESENCE',
        productType: 'PRESENCE',
        ...(sessionId ? { sessionId } : {}),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/get-started`,
    });

    console.log(`[Presence Checkout] Session created: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Presence Checkout] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error creating checkout session', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Stripe Checkout API
 *
 * POST /api/create-checkout
 * Creates Stripe checkout session for BIAB tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';

// ============================================
// TIER CONFIGURATION
// ============================================

interface TierConfig {
  name: string;
  description: string;
  price: number; // in cents
}

const TIER_CONFIG: Record<string, TierConfig> = {
  VALIDATION_PACK: {
    name: 'Starter Pack',
    description: 'Validate your business idea with market research and competitive analysis',
    price: 0, // Free tier
  },
  LAUNCH_BLUEPRINT: {
    name: 'Launch Blueprint',
    description: 'Complete business plan with 16 sections + 5 AI-generated logos',
    price: 19700, // $197.00
  },
  TURNKEY_SYSTEM: {
    name: 'Turnkey System',
    description: 'Everything + live website deployment with full infrastructure',
    price: 49700, // $497.00
  },
};

// ============================================
// REQUEST VALIDATION
// ============================================

const CheckoutSchema = z.object({
  tier: z.enum(['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM']),
  userEmail: z.string().email().optional(),
});

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { tier, userEmail } = CheckoutSchema.parse(body);

    // Get tier configuration
    const tierConfig = TIER_CONFIG[tier];
    if (!tierConfig) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400 }
      );
    }

    // Handle free tier - skip Stripe checkout entirely
    if (tierConfig.price === 0) {
      console.log(`[Checkout] Free tier selected: ${tierConfig.name}`);
      return NextResponse.json({
        free: true,
        tier,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/upload?tier=${tier}`,
      });
    }

    console.log(`[Stripe] Creating checkout for ${tierConfig.name} ($${tierConfig.price / 100})`);
    console.log(`[Stripe] Parameters:`, {
      tier,
      userEmail,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      price: tierConfig.price,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Business In A Box - ${tierConfig.name}`,
              description: tierConfig.description,
            },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true, // Enable promo code field in checkout
      customer_email: userEmail,
      metadata: {
        tier,
        // Will be populated by webhook after payment
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/get-started`,
    });

    console.log(`[Stripe] ✓ Checkout session created: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('[Stripe] Checkout error:', error);
    console.error('[Stripe] Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw,
      statusCode: error.statusCode,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error creating checkout session',
        message: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown'
      },
      { status: 500 }
    );
  }
}
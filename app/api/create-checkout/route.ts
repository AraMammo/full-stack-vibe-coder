/**
 * Stripe Checkout API
 *
 * POST /api/create-checkout
 * Creates Stripe checkout session for BIAB tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe with error handling
let stripe: Stripe | null = null;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe] STRIPE_SECRET_KEY not configured');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
  }
} catch (error) {
  console.error('[Stripe] Failed to initialize:', error);
}

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
    name: 'Validation Pack',
    description: 'Validate your business idea with 5 core analysis sections',
    price: 4700, // $47.00
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
    // Check if Stripe is initialized
    if (!stripe) {
      console.error('[Stripe] Cannot create checkout - Stripe not initialized');
      return NextResponse.json(
        {
          error: 'Payment system not configured',
          message: 'STRIPE_SECRET_KEY is not set. Please configure Stripe in environment variables.'
        },
        { status: 500 }
      );
    }

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

    console.log(`[Stripe] Creating checkout for ${tierConfig.name} ($${tierConfig.price / 100})`);

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
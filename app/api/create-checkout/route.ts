/**
 * Stripe Checkout API
 *
 * POST /api/create-checkout
 * Creates Stripe checkout session for ShipKit tiers.
 * Free tier (VALIDATION_PACK) creates a project directly and triggers the orchestrator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
    name: 'ShipKit Lite',
    description: 'Interactive business brief with name options, value prop, and site preview',
    price: 0, // Free tier
  },
  LAUNCH_BLUEPRINT: {
    name: 'ShipKit Pro',
    description: 'Full branding, strategy, financial projections, and complete business plan',
    price: 19700, // $197.00
  },
  TURNKEY_SYSTEM: {
    name: 'ShipKit Complete',
    description: 'Everything in Pro + full Next.js codebase, deployed website, and GitHub repo',
    price: 49700, // $497.00
  },
};

// ============================================
// REQUEST VALIDATION
// ============================================

const CheckoutSchema = z.object({
  tier: z.enum(['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM']),
  userEmail: z.string().email().optional(),
  sessionId: z.string().optional(), // From chat analysis
});

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { tier, userEmail, sessionId } = CheckoutSchema.parse(body);

    // Get tier configuration
    const tierConfig = TIER_CONFIG[tier];
    if (!tierConfig) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400 }
      );
    }

    // Handle free tier - create project directly, no Stripe
    if (tierConfig.price === 0) {
      console.log(`[Checkout] Free tier selected: ${tierConfig.name}`);

      const authSession = await getServerSession(authOptions);
      if (!authSession?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Look up business concept from chat analysis
      let businessConcept = '';
      if (sessionId) {
        try {
          const chatSubmission = await prisma.chat_submissions.findUnique({
            where: { session_id: sessionId },
          });
          if (chatSubmission) {
            businessConcept = chatSubmission.user_input;
            console.log(`[Checkout] Found chat submission for sessionId: ${sessionId}`);
          }
        } catch (lookupError) {
          console.error('[Checkout] Failed to look up chat submission:', lookupError);
        }
      }

      // Create project for free tier
      const project = await prisma.project.create({
        data: {
          userId: authSession.user.id,
          projectName: tierConfig.name,
          biabTier: 'VALIDATION_PACK',
          businessConcept,
          status: 'PENDING',
        },
      });
      console.log(`[Checkout] Free tier project created: ${project.id}`);

      // Trigger orchestrator (fire and forget — don't block the response)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/shipkit/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          businessConcept: businessConcept || 'Business concept for ShipKit Lite',
          userId: authSession.user.id,
          tier: 'VALIDATION_PACK',
        }),
      }).catch((err) => {
        console.error('[Checkout] Failed to trigger orchestrator for free tier:', err);
      });

      return NextResponse.json({
        free: true,
        tier,
        projectId: project.id,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
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
              name: tierConfig.name,
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
        ...(sessionId ? { sessionId } : {}),
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
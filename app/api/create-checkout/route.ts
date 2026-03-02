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
// SHIPKIT CONFIGURATION — Single Offering
// ============================================

const SHIPKIT_BUILD_PRICE = 49700; // $497.00 one-time build fee
const SHIPKIT_CONFIG = {
  name: 'ShipKit',
  description: 'Full-stack app: built, deployed, and hosted. Live website with database, auth, payments, and email.',
  buildPrice: SHIPKIT_BUILD_PRICE,
};

// ============================================
// REQUEST VALIDATION
// ============================================

const CheckoutSchema = z.object({
  tier: z.enum(['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM']).optional().default('TURNKEY_SYSTEM'),
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

    // Auth required for all paths
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

    // Handle free preview tier (VALIDATION_PACK) — create project directly, no Stripe
    if (tier === 'VALIDATION_PACK') {
      console.log(`[Checkout] Free preview selected`);

      const project = await prisma.project.create({
        data: {
          userId: authSession.user.id,
          projectName: 'ShipKit Preview',
          biabTier: 'VALIDATION_PACK',
          businessConcept,
          status: 'PENDING',
        },
      });
      console.log(`[Checkout] Free preview project created: ${project.id}`);

      // Trigger orchestrator (fire and forget)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/shipkit/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          businessConcept: businessConcept || 'Business concept preview',
          userId: authSession.user.id,
          tier: 'VALIDATION_PACK',
        }),
      }).catch((err) => {
        console.error('[Checkout] Failed to trigger orchestrator for preview:', err);
      });

      return NextResponse.json({
        free: true,
        tier,
        projectId: project.id,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      });
    }

    // Single paid offering: $497 build + $49/mo hosting (30 days free)
    console.log(`[Stripe] Creating checkout for ShipKit ($${SHIPKIT_CONFIG.buildPrice / 100})`);

    // Create Stripe checkout session with the build fee
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: SHIPKIT_CONFIG.name,
              description: SHIPKIT_CONFIG.description,
            },
            unit_amount: SHIPKIT_CONFIG.buildPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      customer_email: userEmail,
      metadata: {
        tier: 'TURNKEY_SYSTEM',
        ...(sessionId ? { sessionId } : {}),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/get-started`,
    });

    console.log(`[Stripe] Checkout session created: ${session.id}`);

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
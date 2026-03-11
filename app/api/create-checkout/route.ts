/**
 * Stripe Checkout API
 *
 * POST /api/create-checkout
 * Creates Stripe checkout session for FSVC tiers.
 * Free tier (VALIDATION_PACK) creates a project directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const BUILD_PRICE = 49700; // $497.00 one-time build fee
const CONFIG = {
  name: 'Full Stack Vibe Coder',
  description: 'Full-stack app: built, deployed, and hosted. Live website with database, auth, payments, and email.',
  buildPrice: BUILD_PRICE,
};

const CheckoutSchema = z.object({
  tier: z.enum(['VALIDATION_PACK', 'LAUNCH_BLUEPRINT', 'TURNKEY_SYSTEM']).optional().default('TURNKEY_SYSTEM'),
  userEmail: z.string().email().optional(),
  sessionId: z.string().optional(),
  hostingAgreed: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, userEmail, sessionId, hostingAgreed } = CheckoutSchema.parse(body);

    if (tier === 'TURNKEY_SYSTEM' && hostingAgreed !== true) {
      return NextResponse.json(
        { error: 'You must agree to the hosting terms before proceeding' },
        { status: 400 }
      );
    }

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
        }
      } catch (lookupError) {
        console.error('[Checkout] Failed to look up chat submission:', lookupError);
      }
    }

    // Free preview tier — create project directly, no Stripe
    if (tier === 'VALIDATION_PACK') {
      const project = await prisma.project.create({
        data: {
          userId: authSession.user.id,
          projectName: 'FSVC Preview',
          biabTier: 'VALIDATION_PACK',
          businessConcept,
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        free: true,
        tier,
        projectId: project.id,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      });
    }

    // Paid: $497 build + $49/mo hosting (30 days free)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: CONFIG.name,
              description: CONFIG.description,
            },
            unit_amount: CONFIG.buildPrice,
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
        hostingAgreed: 'true',
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/get-started`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: unknown) {
    console.error('[Checkout] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    const err = error as Error & { type?: string; code?: string };
    return NextResponse.json(
      {
        error: 'Error creating checkout session',
        message: err.message,
        type: err.type || 'unknown',
        code: err.code || 'unknown'
      },
      { status: 500 }
    );
  }
}

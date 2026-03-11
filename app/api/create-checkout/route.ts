/**
 * Stripe Checkout API
 *
 * POST /api/create-checkout
 * Creates Stripe checkout session for FSVC tiers.
 * Free tier (VALIDATION_PACK) creates a project directly.
 *
 * Flow: Frontend passes the analysis data from /api/shipkit/analyze.
 * We create the project FIRST (with industryProfile populated),
 * then pass projectId into Stripe metadata so the webhook can find it.
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
  // Analysis data from /api/shipkit/analyze — passed through so we can store on project
  analysis: z.object({
    businessNames: z.array(z.object({ name: z.string(), tagline: z.string() })).optional(),
    valueProposition: z.string().optional(),
    targetAudience: z.array(z.object({ segment: z.string(), description: z.string() })).optional(),
    competitivePositioning: z.string().optional(),
    sitePreviewHtml: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
  selectedNameIndex: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, userEmail, sessionId, hostingAgreed, analysis, selectedNameIndex } = CheckoutSchema.parse(body);

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

    // Determine business name from analysis
    const selectedName = analysis?.businessNames?.[selectedNameIndex ?? 0];
    const businessName = selectedName?.name || 'New Project';

    // Build industryProfile from analysis data
    const industryProfile = analysis ? {
      businessName,
      tagline: selectedName?.tagline || '',
      valueProposition: analysis.valueProposition || '',
      targetAudience: analysis.targetAudience || [],
      competitivePositioning: analysis.competitivePositioning || '',
      sitePreviewHtml: analysis.sitePreviewHtml || '',
    } : null;

    // Free preview tier — create project directly, no Stripe
    if (tier === 'VALIDATION_PACK') {
      const project = await prisma.project.create({
        data: {
          userId: authSession.user.id,
          name: businessName,
          status: 'INTAKE',
          ...(industryProfile ? { industryProfile } : {}),
        },
      });

      return NextResponse.json({
        free: true,
        tier,
        projectId: project.id,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      });
    }

    // Paid: Create the project NOW so it exists when webhook fires
    const project = await prisma.project.create({
      data: {
        userId: authSession.user.id,
        name: businessName,
        status: 'INTAKE',
        ...(industryProfile ? { industryProfile } : {}),
      },
    });

    // $497 build + $49/mo hosting (30 days free)
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
        projectId: project.id,
        businessName,
        hostingAgreed: 'true',
        ...(sessionId ? { analyzeSessionId: sessionId } : {}),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/get-started`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      projectId: project.id,
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

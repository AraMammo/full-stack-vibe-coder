/**
 * Create Tool Checkout API
 *
 * POST /api/create-checkout-tool
 * Creates Stripe checkout session for individual tool purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { db } from '@/server/db';
import { toolPurchases, promoCodes } from '@/shared/schema';
import { eq, sql } from 'drizzle-orm';

// Initialize Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
  }
} catch (error) {
  console.error('[Stripe] Failed to initialize:', error);
}

// ============================================
// TOOL CONFIGURATION
// ============================================

interface ToolPricing {
  monthly: number;  // in cents
  annual: number;   // in cents
  lifetime: number; // in cents
}

interface ToolConfig {
  name: string;
  description: string;
  pricing: ToolPricing;
}

const TOOL_CONFIG: Record<string, ToolConfig> = {
  'substack-engine': {
    name: 'Substack Engine',
    description: 'AI-powered Substack article generation and optimization',
    pricing: {
      monthly: 6700,   // $67.00
      annual: 67000,   // $670.00
      lifetime: 19700, // $197.00 (one-time)
    },
  },
  'reaction-video-generator': {
    name: 'Reaction Video Generator',
    description: 'Professional reaction video compositing tool',
    pricing: {
      monthly: 2700,   // $27.00
      annual: 27000,   // $270.00
      lifetime: 9700,  // $97.00 (one-time)
    },
  },
};

// ============================================
// REQUEST VALIDATION
// ============================================

const CheckoutToolSchema = z.object({
  toolId: z.enum(['substack-engine', 'reaction-video-generator']),
  accessType: z.enum(['monthly', 'annual', 'lifetime']),
  email: z.string().email(),
  promoCode: z.string().optional(),
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
          message: 'STRIPE_SECRET_KEY is not set',
        },
        { status: 500 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { toolId, accessType, email, promoCode } = CheckoutToolSchema.parse(body);

    // Get tool configuration
    const toolConfig = TOOL_CONFIG[toolId];
    if (!toolConfig) {
      return NextResponse.json(
        { error: 'Invalid tool selected' },
        { status: 400 }
      );
    }

    // Get base price
    let price = toolConfig.pricing[accessType];
    let discountPercent = 0;

    // Validate promo code if provided
    if (promoCode) {
      const promoResult = await db
        .select()
        .from(promoCodes)
        .where(sql`UPPER(${promoCodes.code}) = UPPER(${promoCode})`)
        .limit(1);

      if (promoResult && promoResult.length > 0) {
        const promo = promoResult[0];

        if (promo.active && (promo.maxUses === null || promo.usesCount < promo.maxUses)) {
          discountPercent = promo.discountPercent;
          price = Math.round(price * (1 - discountPercent / 100));

          // Increment promo code usage
          await db
            .update(promoCodes)
            .set({ usesCount: promo.usesCount + 1 })
            .where(eq(promoCodes.id, promo.id));
        }
      }
    }

    // Handle 100% discount (free access)
    if (price === 0) {
      // Calculate expiration based on access type
      let expiresAt: Date | null = null;
      if (accessType === 'monthly') {
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (accessType === 'annual') {
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
      // lifetime = null expiration

      // Create free access record
      await db.insert(toolPurchases).values({
        email: email.toLowerCase(),
        toolName: toolId,
        accessType: accessType,
        status: 'active',
        expiresAt: expiresAt,
      });

      return NextResponse.json({
        isFree: true,
        message: 'Free access granted! You can now use the tool.',
      });
    }

    // Determine billing mode
    const isRecurring = accessType === 'monthly' || accessType === 'annual';

    console.log(`[Stripe] Creating tool checkout: ${toolConfig.name} (${accessType}) - $${price / 100}`);

    // Create Stripe checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer_email: email,
      metadata: {
        toolId,
        accessType,
        email,
        discountApplied: discountPercent > 0 ? `${discountPercent}%` : 'none',
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tools/${toolId.replace('-generator', '')}?success=true&email=${encodeURIComponent(email)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tools/${toolId.replace('-generator', '')}?canceled=true`,
      mode: isRecurring ? 'subscription' : 'payment',
    };

    if (isRecurring) {
      // Subscription mode
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${toolConfig.name} - ${accessType.charAt(0).toUpperCase() + accessType.slice(1)} Subscription`,
              description: toolConfig.description,
            },
            unit_amount: price,
            recurring: {
              interval: accessType === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ];
    } else {
      // One-time payment (lifetime)
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${toolConfig.name} - Lifetime Access`,
              description: toolConfig.description,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`[Stripe] ✓ Tool checkout session created: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: unknown) {
    console.error('[Stripe] Tool checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error creating checkout session', message: errorMessage },
      { status: 500 }
    );
  }
}

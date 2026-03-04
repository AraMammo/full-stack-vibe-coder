/**
 * Hosting Plan Upgrade/Downgrade
 *
 * POST /api/billing/upgrade
 * Swaps the Stripe subscription price to upgrade or downgrade the hosting plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_HOSTING_PRICE_ID,
  GROWTH: process.env.STRIPE_HOSTING_GROWTH_PRICE_ID,
  SCALE: process.env.STRIPE_HOSTING_SCALE_PRICE_ID,
};

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter ($49/mo)',
  GROWTH: 'Growth ($149/mo)',
  SCALE: 'Scale ($349/mo)',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, plan } = body;

    if (!projectId || !plan) {
      return NextResponse.json({ error: 'projectId and plan are required' }, { status: 400 });
    }

    if (!['STARTER', 'GROWTH', 'SCALE'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be STARTER, GROWTH, or SCALE' }, { status: 400 });
    }

    const newPriceId = PLAN_PRICE_MAP[plan];
    if (!newPriceId) {
      return NextResponse.json({ error: `Price not configured for ${plan} plan` }, { status: 400 });
    }

    // Find the hosting subscription (verify ownership)
    const deployedApp = await prisma.deployedApp.findFirst({
      where: {
        projectId,
        project: { userId: session.user.id },
      },
      include: { subscription: true },
    });

    if (!deployedApp?.subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (deployedApp.subscription.plan === plan) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 });
    }

    // Retrieve the Stripe subscription to get the current item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(
      deployedApp.subscription.stripeSubscriptionId
    );

    const currentItem = stripeSubscription.items.data[0];
    if (!currentItem) {
      return NextResponse.json({ error: 'No subscription item found' }, { status: 500 });
    }

    // Update the subscription with the new price (proration applied automatically)
    await stripe.subscriptions.update(deployedApp.subscription.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });

    // Update DB
    await prisma.hostingSubscription.update({
      where: { id: deployedApp.subscription.id },
      data: { plan: plan as any },
    });

    console.log(`[Billing] Plan upgraded: ${deployedApp.subscription.plan} → ${plan} for project ${projectId}`);

    return NextResponse.json({
      success: true,
      plan,
      planName: PLAN_NAMES[plan],
    });
  } catch (error: any) {
    console.error('[Billing Upgrade] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade plan', message: error.message },
      { status: 500 }
    );
  }
}

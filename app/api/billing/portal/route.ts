/**
 * Stripe Customer Portal
 *
 * POST /api/billing/portal
 * Creates a Stripe billing portal session for managing subscriptions,
 * updating payment methods, and viewing invoices.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Find the deployed app and its hosting subscription
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

    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/project/${projectId}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: deployedApp.subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('[Billing Portal] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session', message: error.message },
      { status: 500 }
    );
  }
}

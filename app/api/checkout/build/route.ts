/**
 * POST /api/checkout/build
 *
 * Creates a Stripe Checkout session for the $497 build product.
 * After payment, the Stripe webhook triggers the full build pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = (await req.json()) as { projectId: string };
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify project ownership and state
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, name: true, status: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.status === "LIVE") {
      return NextResponse.json(
        { error: "Project is already live" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Find or create Stripe customer
    let customerId: string;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Website Build — ${project.name}`,
              description:
                "Full-stack website with database, auth, payments, and hosting",
            },
            unit_amount: 49700, // $497
          },
          quantity: 1,
        },
      ],
      metadata: {
        projectId,
        userId: session.user.id,
        type: "BUILD",
      },
      success_url: `${baseUrl}/dashboard/project/${projectId}?checkout=success`,
      cancel_url: `${baseUrl}/checkout?projectId=${projectId}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[checkout/build] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

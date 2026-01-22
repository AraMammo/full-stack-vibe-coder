/**
 * Check Tool Access API
 *
 * GET /api/check-access?email=...&toolName=...
 * Checks if a user has active access to a specific tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { toolPurchases } from '@/shared/schema';
import { eq, and, or, gt, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const toolName = searchParams.get('toolName');

    // Validate required parameters
    if (!email || !email.trim()) {
      return NextResponse.json(
        { hasAccess: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!toolName || !toolName.trim()) {
      return NextResponse.json(
        { hasAccess: false, message: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { hasAccess: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for active purchase
    // Active means: status is 'active' AND (expires_at is null OR expires_at > now)
    const now = new Date();

    const purchases = await db
      .select()
      .from(toolPurchases)
      .where(
        and(
          eq(toolPurchases.email, email.toLowerCase()),
          eq(toolPurchases.toolName, toolName),
          eq(toolPurchases.status, 'active'),
          or(
            isNull(toolPurchases.expiresAt),
            gt(toolPurchases.expiresAt, now)
          )
        )
      )
      .limit(1);

    if (purchases && purchases.length > 0) {
      const purchase = purchases[0];
      return NextResponse.json({
        hasAccess: true,
        accessType: purchase.accessType,
        expiresAt: purchase.expiresAt?.toISOString() || null,
        message: 'Active subscription found',
      });
    }

    return NextResponse.json({
      hasAccess: false,
      message: 'No active subscription found for this tool',
    });

  } catch (error) {
    console.error('[check-access] Error:', error);
    return NextResponse.json(
      { hasAccess: false, message: 'Error checking access' },
      { status: 500 }
    );
  }
}

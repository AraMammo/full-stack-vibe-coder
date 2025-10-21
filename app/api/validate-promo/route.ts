import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { promoCodes } from '@/shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code || !code.trim()) {
      return NextResponse.json(
        { valid: false, discountPercent: 0, message: 'Promo code is required' },
        { status: 400 }
      );
    }

    const promoCode = await db
      .select()
      .from(promoCodes)
      .where(sql`UPPER(${promoCodes.code}) = UPPER(${code})`)
      .limit(1);

    if (!promoCode || promoCode.length === 0) {
      return NextResponse.json({
        valid: false,
        discountPercent: 0,
        message: 'Invalid promo code',
      });
    }

    const promo = promoCode[0];

    if (!promo.active) {
      return NextResponse.json({
        valid: false,
        discountPercent: 0,
        message: 'This promo code is no longer active',
      });
    }

    if (promo.maxUses !== null && promo.usesCount >= promo.maxUses) {
      return NextResponse.json({
        valid: false,
        discountPercent: 0,
        message: 'This promo code has reached its usage limit',
      });
    }

    // Validate discount percent is between 0-100
    if (promo.discountPercent < 0 || promo.discountPercent > 100) {
      return NextResponse.json({
        valid: false,
        discountPercent: 0,
        message: 'Invalid discount configuration. Please contact support.',
      });
    }

    return NextResponse.json({
      valid: true,
      discountPercent: promo.discountPercent,
      message: `${promo.discountPercent}% discount applied!`,
      code: promo.code,
    });
  } catch (err) {
    console.error('Promo code validation error:', err);
    return NextResponse.json(
      { valid: false, discountPercent: 0, message: 'Error validating promo code' },
      { status: 500 }
    );
  }
}

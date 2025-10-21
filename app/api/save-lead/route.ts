import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { chatSubmissions } from '@/shared/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, recommendedProduct } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    await db.insert(chatSubmissions).values({
      name,
      email,
      userInput: 'Lead from chat recommendation',
      inputType: 'text',
      aiRecommendation: `Recommended: ${recommendedProduct}`,
      recommendedProduct,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: 'Failed to save lead' },
      { status: 500 }
    );
  }
}

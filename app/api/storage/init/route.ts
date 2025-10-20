/**
 * Storage Initialization Endpoint
 *
 * Creates necessary Supabase storage buckets.
 * Run this once after setting up Supabase.
 */

import { NextResponse } from 'next/server';
import { initializeStorageBuckets } from '@/lib/storage';

export async function GET() {
  try {
    await initializeStorageBuckets();

    return NextResponse.json({
      success: true,
      message: 'Storage buckets initialized successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Storage initialization error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

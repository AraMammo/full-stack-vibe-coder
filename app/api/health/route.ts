/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies.
 */

import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/db';

export async function GET() {
  try {
    const dbHealth = await getDatabaseHealth();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

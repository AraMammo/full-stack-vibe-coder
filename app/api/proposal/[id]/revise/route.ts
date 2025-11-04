/**
 * Proposal Revision Request API
 *
 * Accepts client feedback and triggers proposal regeneration
 * TODO: Implement Proposal model in Prisma schema before enabling this route
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Feature not yet implemented - Proposal model needs to be added to Prisma schema
    return NextResponse.json(
      {
        error: 'Feature not implemented',
        message: 'Proposal revision API requires Proposal model in database schema'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Proposal revision error:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit revision request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

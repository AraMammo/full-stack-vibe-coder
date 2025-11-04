/**
 * Proposal Approval API
 *
 * Accepts a proposal and converts it to an active project
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
        message: 'Proposal approval API requires Proposal model in database schema'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Proposal approval error:', error);

    return NextResponse.json(
      {
        error: 'Failed to approve proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

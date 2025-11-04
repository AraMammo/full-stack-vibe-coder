/**
 * Project Tasks API
 *
 * Retrieve tasks for a project with filtering and sorting
 * TODO: Implement Task model in Prisma schema before enabling this route
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(
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

    // Feature not yet implemented - Task model needs to be added to Prisma schema
    return NextResponse.json(
      {
        error: 'Feature not implemented',
        message: 'Project tasks API requires Task model in database schema'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Get tasks error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

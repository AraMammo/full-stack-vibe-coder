/**
 * GET /api/faceless-video/jobs
 * List all video generation jobs for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    // Fetch jobs with scenes
    const [jobs, total] = await Promise.all([
      prisma.facelessVideoJob.findMany({
        where,
        include: {
          scenes: {
            orderBy: { sceneIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.facelessVideoJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

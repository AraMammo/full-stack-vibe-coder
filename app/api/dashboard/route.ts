/**
 * Dashboard Data API
 *
 * Returns all workflows and proposals for the authenticated user
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Workflow model not yet implemented - return empty data
    // TODO: Uncomment when Workflow model is added to Prisma schema
    /*
    const workflows = await prisma.workflow.findMany({
      where: { userId },
      include: {
        voiceNote: {
          select: {
            fileName: true,
            createdAt: true,
            transcript: true,
          },
        },
        proposal: {
          select: {
            id: true,
            title: true,
            status: true,
            estimatedCost: true,
            estimatedDays: true,
            createdAt: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
        steps: {
          select: {
            agentName: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    */

    const workflows: any[] = [];

    // Calculate stats
    const stats = {
      total: workflows.length,
      pending: workflows.filter(w => w.status === 'pending' || w.status === 'in_progress').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      approved: workflows.filter(w => w.proposal?.status === 'approved').length,
    };

    return NextResponse.json({
      workflows,
      stats,
      user: {
        name: session.user.name,
        email: session.user.email,
      },
    });

  } catch (error) {
    console.error('Dashboard API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

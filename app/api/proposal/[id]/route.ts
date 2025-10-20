/**
 * Proposal Detail API
 *
 * Returns full proposal data for viewing
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const proposalId = params.id;

    // Fetch proposal with all related data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        workflow: {
          include: {
            voiceNote: {
              select: {
                transcript: true,
                createdAt: true,
              },
            },
            steps: {
              orderBy: {
                stepOrder: 'asc',
              },
            },
          },
        },
        approvals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        project: {
          select: {
            id: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (proposal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(proposal);

  } catch (error) {
    console.error('Proposal API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to load proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

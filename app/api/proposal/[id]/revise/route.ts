/**
 * Proposal Revision Request API
 *
 * Accepts client feedback and triggers proposal regeneration
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
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

    const { feedback } = await request.json();

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    const proposalId = params.id;

    // Fetch proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workflow: {
          include: {
            voiceNote: true,
          },
        },
        approvals: true,
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

    // Check if already approved
    if (proposal.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot revise an approved proposal' },
        { status: 400 }
      );
    }

    // Count revision requests
    const revisionCount = proposal.approvals.filter(
      a => a.status === 'revision_requested'
    ).length;

    if (revisionCount >= 2) {
      return NextResponse.json(
        {
          error: 'Maximum revisions reached. Please contact support for further changes.',
          revisionCount,
        },
        { status: 400 }
      );
    }

    // Update proposal status
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'revision_requested' },
    });

    // Create revision approval record
    await prisma.proposalApproval.create({
      data: {
        proposalId,
        userId: session.user.id,
        status: 'revision_requested',
        feedback,
      },
    });

    // Update workflow with revision context
    await prisma.workflow.update({
      where: { id: proposal.workflowId },
      data: {
        status: 'revision_requested',
        context: {
          ...(proposal.workflow.context as any),
          revisionFeedback: feedback,
          revisionCount: revisionCount + 1,
          previousProposal: proposal.content,
        },
      },
    });

    console.log(`✓ Revision requested for proposal ${proposalId}`);
    console.log(`Feedback: ${feedback.substring(0, 100)}...`);

    // TODO: Re-run agents with revision context
    // This would involve calling the workflow executor with revision mode
    // For now, we'll flag it for manual review

    // TODO: Send notification to admin about revision request

    return NextResponse.json({
      success: true,
      message: 'Revision request submitted. We\'ll generate an updated proposal shortly.',
      revisionCount: revisionCount + 1,
    });

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

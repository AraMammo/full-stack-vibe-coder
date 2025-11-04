/**
 * Workflow Execution Trigger API
 *
 * Starts the AI agent workflow for a given workflow ID.
 * This endpoint should be called after a voice note is uploaded and transcribed.
 * TODO: Implement Workflow model in Prisma schema before enabling this route
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

    // Feature not yet implemented - Workflow model needs to be added to Prisma schema
    return NextResponse.json(
      {
        error: 'Feature not implemented',
        message: 'Workflow execution API requires Workflow model in database schema'
      },
      { status: 501 }
    );

    /* TODO: Uncomment when Workflow model is added to Prisma schema
    const workflowId = params.id;

    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if workflow is already running or completed
    if (workflow.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Workflow is already running' },
        { status: 400 }
      );
    }

    if (workflow.status === 'completed') {
      return NextResponse.json(
        { error: 'Workflow already completed' },
        { status: 400 }
      );
    }

    // Execute workflow asynchronously
    // Note: In production, this should be a background job
    // For now, we'll execute it synchronously (may take 30-60 seconds)
    const result = await workflowExecutor.executeProposalWorkflow(workflowId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Workflow completed successfully',
        workflowId,
        proposalId: result.proposalId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
    */

  } catch (error) {
    console.error('Workflow execution API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to execute workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

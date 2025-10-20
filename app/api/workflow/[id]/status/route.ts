/**
 * Workflow Status API
 *
 * Returns the current status and progress of a workflow.
 * Used for polling or displaying real-time updates to the user.
 */

import { NextResponse } from 'next/server';
import { workflowExecutor } from '@/lib/agents/workflow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workflowId = params.id;

    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true },
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

    // Get workflow status
    const status = await workflowExecutor.getWorkflowStatus(workflowId);

    if (!status) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(status);

  } catch (error) {
    console.error('Workflow status API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get workflow status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

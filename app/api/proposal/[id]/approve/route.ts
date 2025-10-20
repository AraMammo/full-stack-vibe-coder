/**
 * Proposal Approval API
 *
 * Approves a proposal and creates a project
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OrchestratorAgent } from '@/lib/agents/orchestrator-agent';
import type { OrchestratorInput } from '@/lib/agents/types';

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

    const proposalId = params.id;

    // Fetch proposal with full context
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        workflow: {
          include: {
            voiceNote: true,
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

    // Check if already approved
    if (proposal.status === 'approved') {
      return NextResponse.json(
        { error: 'Proposal already approved' },
        { status: 400 }
      );
    }

    // Update proposal status
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'approved' },
    });

    // Create approval record
    await prisma.proposalApproval.create({
      data: {
        proposalId,
        userId: session.user.id,
        status: 'approved',
      },
    });

    // Create project
    const proposalContent = proposal.content as any;
    const project = await prisma.project.create({
      data: {
        workflowId: proposal.workflowId,
        proposalId: proposal.id,
        userId: session.user.id,
        name: proposal.title,
        description: proposal.summary,
        status: 'not_started',
        progress: 0,
        deadline: new Date(Date.now() + proposal.estimatedDays * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`✓ Proposal ${proposalId} approved by user ${session.user.id}`);
    console.log(`✓ Project ${project.id} created`);

    // TODO: Send approval confirmation email

    // Trigger Orchestrator Agent to break down project
    console.log(`[approve] Triggering orchestrator for project ${project.id}...`);

    try {
      // Get workflow context for scope and estimate
      const workflowContext = proposal.workflow.context as any;

      if (workflowContext?.scope && workflowContext?.estimate) {
        const orchestratorInput: OrchestratorInput = {
          projectId: project.id,
          userId: session.user.id,
          proposal: proposal.content as any,
          scope: workflowContext.scope,
          estimate: workflowContext.estimate,
        };

        const orchestrator = new OrchestratorAgent();
        const result = await orchestrator.execute(orchestratorInput);

        if (result.success && result.data) {
          await orchestrator.saveToDatabase(result.data);
          console.log(`[approve] ✓ Orchestration completed: ${result.data.summary.totalTasks} tasks created`);
        } else {
          console.error('[approve] Orchestration failed:', result.error);
          // Non-blocking - project still approved, can orchestrate manually later
          await prisma.project.update({
            where: { id: project.id },
            data: { status: 'orchestration_failed' },
          });
        }
      } else {
        console.warn('[approve] Skipping orchestration - missing workflow context');
      }
    } catch (orchestrationError) {
      console.error('[approve] Orchestration error:', orchestrationError);
      // Non-blocking error - project is still approved
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal approved successfully',
      projectId: project.id,
    });

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

/**
 * Project Orchestration API
 *
 * Triggers the Orchestrator Agent to break down a project into tasks
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

    const projectId = params.id;

    // Fetch project with all necessary relations
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        proposal: true,
        workflow: {
          include: {
            voiceNote: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if already orchestrated
    const existingTasks = await prisma.task.findMany({
      where: { projectId },
      take: 1,
    });

    if (existingTasks.length > 0) {
      return NextResponse.json(
        { error: 'Project already orchestrated. Delete existing tasks first to re-orchestrate.' },
        { status: 400 }
      );
    }

    // Get workflow context for scope and estimate
    const workflowContext = project.workflow.context as any;

    if (!workflowContext?.scope || !workflowContext?.estimate) {
      return NextResponse.json(
        { error: 'Missing workflow context. Workflow may not have completed successfully.' },
        { status: 400 }
      );
    }

    // Prepare orchestrator input
    const orchestratorInput: OrchestratorInput = {
      projectId: project.id,
      userId: project.userId,
      proposal: project.proposal.content as any,
      scope: workflowContext.scope,
      estimate: workflowContext.estimate,
    };

    console.log(`[orchestrate] Starting orchestration for project ${projectId}...`);

    // Run Orchestrator Agent
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.execute(orchestratorInput);

    if (!result.success || !result.data) {
      console.error('[orchestrate] Orchestrator failed:', result.error);

      // Mark project as failed
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'orchestration_failed' },
      });

      return NextResponse.json(
        {
          error: 'Orchestration failed',
          details: result.error,
        },
        { status: 500 }
      );
    }

    // Save execution plan to database
    await orchestrator.saveToDatabase(result.data);

    console.log(`[orchestrate] ✓ Project ${projectId} orchestrated successfully`);
    console.log(`[orchestrate] Created ${result.data.tasks.length} tasks`);

    return NextResponse.json({
      success: true,
      message: 'Project orchestrated successfully',
      executionPlan: {
        totalTasks: result.data.summary.totalTasks,
        phases: result.data.phases.length,
        tasksByPhase: result.data.summary.tasksByPhase,
        tasksByAgent: result.data.summary.tasksByAgent,
      },
    });

  } catch (error) {
    console.error('Orchestration error:', error);

    return NextResponse.json(
      {
        error: 'Failed to orchestrate project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

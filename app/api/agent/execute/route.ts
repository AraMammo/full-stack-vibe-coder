/**
 * Agent Execution API
 *
 * Manually trigger specialist agents to execute tasks
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FrontendAgent } from '@/lib/agents/frontend-agent';
// Import other agents as they're implemented
// import { BackendAgent } from '@/lib/agents/backend-agent';
// import { DesignAgent } from '@/lib/agents/design-agent';
// import { ContentAgent } from '@/lib/agents/content-agent';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = await request.json();

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Fetch task with project info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (task.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if task is ready to execute
    if (task.status === 'completed') {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      );
    }

    if (task.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Task already in progress' },
        { status: 400 }
      );
    }

    // Check dependencies are completed
    if (task.dependsOn.length > 0) {
      const dependencies = await prisma.task.findMany({
        where: {
          id: { in: task.dependsOn },
        },
        select: {
          id: true,
          status: true,
          title: true,
        },
      });

      const incompleteDeps = dependencies.filter(dep => dep.status !== 'completed');

      if (incompleteDeps.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot execute task with incomplete dependencies',
            incompleteDependencies: incompleteDeps.map(dep => ({
              id: dep.id,
              title: dep.title,
              status: dep.status,
            })),
          },
          { status: 400 }
        );
      }
    }

    console.log(`[agent-execute] Executing task ${taskId} with agent ${task.agentName}`);

    // Instantiate appropriate specialist agent
    let agent;
    switch (task.agentName) {
      case 'frontend':
        agent = new FrontendAgent();
        break;

      // TODO: Add other agents as they're implemented
      // case 'backend':
      //   agent = new BackendAgent();
      //   break;
      // case 'design':
      //   agent = new DesignAgent();
      //   break;
      // case 'content':
      //   agent = new ContentAgent();
      //   break;

      case 'human':
      case 'qa':
      case 'infrastructure':
        return NextResponse.json(
          {
            error: `Task requires human review. Agent type '${task.agentName}' cannot be automated.`,
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            error: `Unknown agent type: ${task.agentName}. Agent not implemented yet.`,
          },
          { status: 400 }
        );
    }

    // Execute the task
    const result = await agent.run(taskId);

    if (!result.success) {
      console.error(`[agent-execute] Task ${taskId} failed:`, result.error);

      return NextResponse.json(
        {
          error: 'Task execution failed',
          details: result.error,
        },
        { status: 500 }
      );
    }

    console.log(`[agent-execute] ✓ Task ${taskId} completed successfully`);
    console.log(`[agent-execute] Generated ${result.artifacts?.length || 0} artifacts`);

    // Fetch updated task with artifacts
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        artifacts: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            artifactType: true,
            language: true,
            linesOfCode: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task executed successfully',
      task: {
        id: updatedTask?.id,
        title: updatedTask?.title,
        status: updatedTask?.status,
        completedAt: updatedTask?.completedAt,
      },
      execution: {
        summary: result.summary,
        artifactCount: result.artifacts?.length || 0,
        tokensUsed: result.metadata?.tokensUsed,
        executionTimeMs: result.metadata?.executionTimeMs,
      },
      artifacts: updatedTask?.artifacts || [],
    });

  } catch (error) {
    console.error('Agent execution error:', error);

    return NextResponse.json(
      {
        error: 'Failed to execute task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

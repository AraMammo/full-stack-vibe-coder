/**
 * Project Tasks API
 *
 * Returns filtered task list for a project
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

    const projectId = params.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get('status');
    const agentType = searchParams.get('agentType');
    const phase = searchParams.get('phase');
    const priority = searchParams.get('priority');
    const readyOnly = searchParams.get('readyOnly') === 'true';

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Build filter conditions
    const where: any = { projectId };

    if (status) {
      where.status = status;
    }

    if (agentType) {
      where.agentName = agentType;
    }

    if (phase) {
      where.phase = phase;
    }

    if (priority) {
      where.priority = priority;
    }

    // If readyOnly, filter for tasks with no pending dependencies
    if (readyOnly) {
      where.status = 'ready';
      where.dependsOn = { isEmpty: true };
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Format response
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      agentName: task.agentName,
      phase: task.phase,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      estimatedHours: (task.input as any)?.estimatedHours || 0,
      requiresHumanReview: (task.input as any)?.requiresHumanReview || false,
      acceptanceCriteria: (task.input as any)?.acceptanceCriteria || [],
      technicalContext: (task.input as any)?.technicalContext || {},
      dependsOn: task.dependsOn,
      dependencyCount: task.dependsOn.length,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      dueDate: task.dueDate,
    }));

    // Calculate summary
    const summary = {
      total: formattedTasks.length,
      byStatus: formattedTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byAgent: formattedTasks.reduce((acc, task) => {
        acc[task.agentName] = (acc[task.agentName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPhase: formattedTasks.reduce((acc, task) => {
        const phase = task.phase || 'unassigned';
        acc[phase] = (acc[phase] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      tasks: formattedTasks,
      summary,
      filters: {
        status: status || 'all',
        agentType: agentType || 'all',
        phase: phase || 'all',
        priority: priority || 'all',
        readyOnly,
      },
    });

  } catch (error) {
    console.error('Tasks fetch error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

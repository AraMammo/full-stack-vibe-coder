/**
 * Project Plan API
 *
 * Returns the execution plan for a project (tasks grouped by phase)
 * TODO: Implement Task model and Project relations in Prisma schema before enabling this route
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(
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

    // Feature not yet implemented - Task model and Project relations need to be added to Prisma schema
    return NextResponse.json(
      {
        error: 'Feature not implemented',
        message: 'Project plan API requires Task model and Project relations in database schema'
      },
      { status: 501 }
    );

    /* TODO: Uncomment when Task model and relations are added to Prisma schema
    const projectId = params.id;

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        proposal: {
          select: {
            title: true,
            estimatedCost: true,
            estimatedDays: true,
          },
        },
        tasks: {
          orderBy: [
            { phase: 'asc' },
            { priority: 'desc' },
            { createdAt: 'asc' },
          ],
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

    // Group tasks by phase
    const tasksByPhase = project.tasks.reduce((acc, task) => {
      const phase = task.phase || 'unassigned';
      if (!acc[phase]) {
        acc[phase] = [];
      }
      acc[phase].push(task);
      return acc;
    }, {} as Record<string, typeof project.tasks>);

    // Calculate statistics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress').length;
    const readyTasks = project.tasks.filter(t => t.status === 'ready').length;
    const blockedTasks = project.tasks.filter(t => t.status === 'pending').length;

    // Calculate progress
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Organize phases in order
    const phaseOrder = ['design', 'build', 'test', 'launch', 'unassigned'];
    const phases = phaseOrder
      .filter(phase => tasksByPhase[phase] && tasksByPhase[phase].length > 0)
      .map(phase => {
        const phaseTasks = tasksByPhase[phase];
        const phaseCompleted = phaseTasks.filter(t => t.status === 'completed').length;
        const phaseProgress = Math.round((phaseCompleted / phaseTasks.length) * 100);

        return {
          name: phase,
          displayName: phase.charAt(0).toUpperCase() + phase.slice(1),
          totalTasks: phaseTasks.length,
          completedTasks: phaseCompleted,
          progress: phaseProgress,
          tasks: phaseTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            agentName: task.agentName,
            status: task.status,
            priority: task.priority,
            estimatedHours: (task.input as any)?.estimatedHours || 0,
            dependsOn: task.dependsOn,
            requiresHumanReview: (task.input as any)?.requiresHumanReview || false,
            createdAt: task.createdAt,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
          })),
        };
      });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress,
        deadline: project.deadline,
        startDate: project.startDate,
        estimatedCost: project.proposal.estimatedCost,
        estimatedDays: project.proposal.estimatedDays,
      },
      statistics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        readyTasks,
        blockedTasks,
        progress,
      },
      phases,
    });
    */

  } catch (error) {
    console.error('Project plan error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch project plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

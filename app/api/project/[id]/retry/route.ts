/**
 * Retry failed project builds
 * POST /api/project/[id]/retry
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: {
      id: true,
      status: true,
      biabTier: true,
      businessConcept: true,
      createdAt: true,
      contextIds: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Only allow retry for FAILED or stale PENDING (> 30 min)
  const isStale = project.status === 'PENDING' &&
    new Date().getTime() - new Date(project.createdAt).getTime() > 30 * 60 * 1000;

  if (project.status !== 'FAILED' && !isStale) {
    return NextResponse.json(
      { error: 'Project can only be retried if it has failed or is stale' },
      { status: 400 }
    );
  }

  try {
    // Reset project state
    await prisma.project.update({
      where: { id: params.id },
      data: {
        status: 'PENDING',
        progress: 0,
        completedPrompts: 0,
        errorMessage: null,
        codegenStatus: null,
      },
    });

    // Delete partial prompt executions
    await prisma.promptExecution.deleteMany({
      where: { projectId: params.id },
    });

    // Delete partial deployed app records
    await prisma.deployedApp.deleteMany({
      where: { projectId: params.id },
    });

    // Re-trigger orchestrator via the execute API (fire and forget)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    fetch(`${baseUrl}/api/shipkit/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: params.id,
        businessConcept: project.businessConcept,
        userId: session.user.id,
        tier: project.biabTier,
        contextIds: project.contextIds,
      }),
    }).catch((err) => {
      console.error(`[Retry] Failed to trigger orchestrator: ${err}`);
    });

    return NextResponse.json({ success: true, message: 'Build restarted' });
  } catch (error) {
    console.error('[Retry] Error:', error);
    return NextResponse.json(
      { error: 'Failed to restart build' },
      { status: 500 }
    );
  }
}

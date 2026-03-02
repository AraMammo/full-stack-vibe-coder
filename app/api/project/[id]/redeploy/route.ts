/**
 * Redeploy API
 *
 * POST /api/project/[id]/redeploy — Trigger a Vercel redeployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as vercel from '@/lib/services/vercel-provisioning';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { deployedApp: true },
    });

    if (!project?.deployedApp) {
      return NextResponse.json({ error: 'No deployed app found' }, { status: 404 });
    }

    const app = project.deployedApp;

    if (!app.vercelProjectName || !app.githubRepoFullName) {
      return NextResponse.json(
        { error: 'Missing Vercel project or GitHub repo info' },
        { status: 400 }
      );
    }

    if (app.hostingStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot redeploy app with status: ${app.hostingStatus}` },
        { status: 400 }
      );
    }

    // Trigger redeployment
    const deployment = await vercel.triggerDeploy(
      app.vercelProjectName,
      app.githubRepoFullName
    );

    return NextResponse.json({
      deploymentId: deployment.deploymentId,
      url: deployment.url,
      status: deployment.readyState,
    });
  } catch (error: any) {
    console.error('[Redeploy API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger redeployment' },
      { status: 500 }
    );
  }
}

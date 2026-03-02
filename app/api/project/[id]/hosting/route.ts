/**
 * Hosting Status API
 *
 * GET /api/project/[id]/hosting — Return hosting status, provisioning log, URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
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
      include: {
        deployedApp: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.deployedApp) {
      return NextResponse.json({
        hasDeployedApp: false,
        projectStatus: project.status,
      });
    }

    const app = project.deployedApp;

    return NextResponse.json({
      hasDeployedApp: true,
      hostingStatus: app.hostingStatus,
      productionUrl: app.vercelProductionUrl,
      githubRepoUrl: app.githubRepoUrl,
      githubRepoFullName: app.githubRepoFullName,
      customDomain: app.customDomain,
      domainVerified: app.domainVerified,
      stripeConnectOnboarded: app.stripeConnectOnboarded,
      provisioningLog: app.provisioningLog,
      subscription: app.subscription ? {
        status: app.subscription.status,
        currentPeriodEnd: app.subscription.currentPeriodEnd,
      } : null,
      createdAt: app.createdAt,
    });
  } catch (error: any) {
    console.error('[Hosting API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get hosting status' },
      { status: 500 }
    );
  }
}

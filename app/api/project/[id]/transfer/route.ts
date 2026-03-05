/**
 * Transfer API
 *
 * POST /api/project/[id]/transfer — Initiate ownership transfer
 * GET  /api/project/[id]/transfer — Check transfer status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { initiateTransfer, getTransferStatus } from '@/lib/services/transfer-service';

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
      include: {
        deployedApp: {
          include: { subscription: true },
        },
      },
    });

    if (!project?.deployedApp) {
      return NextResponse.json({ error: 'No deployed app found' }, { status: 404 });
    }

    if (project.deployedApp.hostingStatus === 'TRANSFERRED') {
      return NextResponse.json({ error: 'App already transferred' }, { status: 400 });
    }

    if (project.deployedApp.hostingStatus === 'EJECTED') {
      return NextResponse.json({ error: 'App already ejected' }, { status: 400 });
    }

    const body = await request.json();
    const { customerEmail, customerGithubUsername } = body;

    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 });
    }

    const result = await initiateTransfer({
      deployedAppId: project.deployedApp.id,
      customerEmail,
      customerGithubUsername,
    });

    return NextResponse.json({
      success: true,
      transferRequestId: result.transferRequestId,
      claimUrls: {
        github: result.githubTransferUrl,
        neon: result.neonClaimUrl,
        vercel: result.vercelReimportUrl,
      },
      message: 'Transfer initiated. The customer will receive emails with claim instructions.',
    });
  } catch (error: any) {
    console.error('[Transfer API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate transfer' },
      { status: 500 }
    );
  }
}

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
            transfers: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!project?.deployedApp) {
      return NextResponse.json({ error: 'No deployed app found' }, { status: 404 });
    }

    const latestTransfer = project.deployedApp.transfers[0];
    if (!latestTransfer) {
      return NextResponse.json({ error: 'No transfer request found' }, { status: 404 });
    }

    const status = await getTransferStatus(latestTransfer.id);

    return NextResponse.json({
      transferRequestId: latestTransfer.id,
      ...status,
      claimUrls: {
        github: latestTransfer.githubTransferUrl,
        neon: latestTransfer.neonClaimUrl,
        vercel: latestTransfer.vercelReimportUrl,
      },
    });
  } catch (error: any) {
    console.error('[Transfer API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check transfer status' },
      { status: 500 }
    );
  }
}

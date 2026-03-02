/**
 * Eject API
 *
 * POST /api/project/[id]/eject — Generate eject package, cancel subscription, update status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ejectApp } from '@/lib/services/eject-service';

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

    if (project.deployedApp.hostingStatus === 'EJECTED') {
      return NextResponse.json({ error: 'App already ejected' }, { status: 400 });
    }

    const result = await ejectApp(project.deployedApp.id);

    return NextResponse.json({
      success: true,
      downloadUrl: result.downloadUrl,
      message: 'Your app has been ejected. Download your code and follow the migration guide.',
    });
  } catch (error: any) {
    console.error('[Eject API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to eject app' },
      { status: 500 }
    );
  }
}

/**
 * Change Request API
 *
 * POST /api/projects/[id]/change
 * Submit a change request for a deployed project.
 * Gated behind active hosting subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { processChangeRequest } from '@/lib/iteration/changeHandler';
import { z } from 'zod';

const ChangeRequestSchema = z.object({
  message: z.string().min(5, 'Change request must be at least 5 characters'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = ChangeRequestSchema.parse(body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        deployedApp: {
          include: { subscription: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.deployedApp) {
      return NextResponse.json({ error: 'Project has no deployed app' }, { status: 400 });
    }

    // Gate behind active subscription
    const subscription = project.deployedApp.subscription;
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Active subscription required',
          message: 'Change requests require an active hosting subscription ($49/mo)',
          code: 'SUBSCRIPTION_REQUIRED',
        },
        { status: 402 }
      );
    }

    // Create change request record
    const changeRequest = await prisma.changeRequest.create({
      data: {
        projectId: params.id,
        userMessage: message,
        status: 'PENDING',
      },
    });

    console.log(`[ChangeAPI] Created change request ${changeRequest.id} for project ${params.id}`);

    // Process asynchronously — don't block the response
    processChangeRequest(params.id, changeRequest.id, message)
      .then((result) => {
        console.log(`[ChangeAPI] Change request ${changeRequest.id} completed:`, result.success);
      })
      .catch((error) => {
        console.error(`[ChangeAPI] Change request ${changeRequest.id} failed:`, error);
      });

    return NextResponse.json({
      success: true,
      changeRequestId: changeRequest.id,
      status: 'PENDING',
      message: 'Change request submitted. Processing will begin shortly.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[ChangeAPI] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/change
 * List change requests for a project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const changeRequests = await prisma.changeRequest.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ changeRequests });
  } catch (error) {
    console.error('[ChangeAPI] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

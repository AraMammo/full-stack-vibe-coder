/**
 * Refinement API
 *
 * GET  /api/projects/[id]/refine — List refinement cycles for a project
 * POST /api/projects/[id]/refine — Trigger a manual refinement cycle on a deployed project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { runSingleCycle } from '@/lib/openclaw';

/**
 * GET /api/projects/[id]/refine
 * Returns refinement history with agent evaluations.
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

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const cycles = await prisma.refinementCycle.findMany({
      where: { projectId: params.id },
      include: {
        evaluations: {
          orderBy: { skill: 'asc' },
        },
      },
      orderBy: { cycleNumber: 'asc' },
    });

    return NextResponse.json({ cycles });
  } catch (error) {
    console.error('[RefineAPI] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/refine
 * Trigger a manual refinement cycle. Requires active subscription.
 * Fetches current files from GitHub, runs one OpenClaw cycle, commits changes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
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
          message: 'Manual refinement requires an active hosting subscription ($49/mo)',
          code: 'SUBSCRIPTION_REQUIRED',
        },
        { status: 402 }
      );
    }

    // Fetch current files from GitHub repo
    const deployedApp = project.deployedApp;
    if (!deployedApp?.githubRepoFullName) {
      return NextResponse.json(
        { error: 'No GitHub repo found for this project' },
        { status: 400 }
      );
    }

    // TODO: Fetch live files from GitHub API
    // For now, return an error if no files can be loaded
    const files = new Map<string, string>();
    const orchestratorOutputs: Record<string, string> = {};

    if (files.size === 0) {
      return NextResponse.json(
        { error: 'Could not load project files from GitHub. GitHub file fetching not yet implemented.' },
        { status: 400 }
      );
    }

    // Run single refinement cycle (async — don't block response)
    runSingleCycle(params.id, files, orchestratorOutputs)
      .then((result) => {
        console.log(`[RefineAPI] Manual refinement complete for project ${params.id}: ${result.actions.length} files updated`);
      })
      .catch((error) => {
        console.error(`[RefineAPI] Manual refinement failed for project ${params.id}:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Refinement cycle started. Check back shortly for results.',
    });
  } catch (error) {
    console.error('[RefineAPI] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

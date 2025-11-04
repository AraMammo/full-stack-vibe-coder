/**
 * API Route: Package BIAB Deliverables
 *
 * POST /api/project/[id]/package-delivery
 * Creates a downloadable ZIP package with all prompt executions
 */

import { NextRequest, NextResponse } from 'next/server';
import { packageBIABDeliverables } from '@/lib/delivery/package-biab-deliverables';
import { z } from 'zod';

// ============================================
// REQUEST SCHEMA
// ============================================

const PackageDeliverySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// ============================================
// POST HANDLER
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = PackageDeliverySchema.parse(body);

    console.log(`[API] Package delivery request for project: ${projectId}`);

    // Fetch project to get tier
    const { prisma } = await import('@/lib/db');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { biabTier: true, projectName: true, userId: true },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== validatedData.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      );
    }

    // Create delivery package
    const result = await packageBIABDeliverables(projectId, validatedData.userId, {
      tier: project.biabTier,
      projectName: project.projectName,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create package',
        },
        { status: 500 }
      );
    }

    console.log(`[API] Package created successfully`);
    console.log(`[API] Package ID: ${result.packageId}`);
    console.log(`[API] File size: ${((result.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`);

    return NextResponse.json({
      success: true,
      packageId: result.packageId,
      downloadUrl: result.downloadUrl,
      expiresAt: result.expiresAt,
      fileSize: result.fileSize,
    });

  } catch (error) {
    console.error('[API] Package delivery error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

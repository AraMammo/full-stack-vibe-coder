/**
 * API Route: Execute Business in a Box
 *
 * POST /api/business-in-a-box/execute
 * Triggers the BIAB Orchestrator to execute all 16 prompts for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { BIABOrchestratorAgent } from '@/lib/agents/biab-orchestrator-agent';
import { BIABTier } from '@/app/generated/prisma';
import { z } from 'zod';

// ============================================
// REQUEST SCHEMA
// ============================================

const ExecuteBIABSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  businessConcept: z.string().min(10, 'Business concept must be at least 10 characters'),
  userId: z.string().min(1, 'User ID is required'),
  tier: z.enum([BIABTier.VALIDATION_PACK, BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM]),
});

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = ExecuteBIABSchema.parse(body);

    console.log(`[API] BIAB execution request for project: ${validatedData.projectId}`);
    console.log(`[API] Tier: ${validatedData.tier}`);

    // Execute BIAB Orchestrator
    const orchestrator = new BIABOrchestratorAgent();
    const result = await orchestrator.execute({
      projectId: validatedData.projectId,
      businessConcept: validatedData.businessConcept,
      userId: validatedData.userId,
      tier: validatedData.tier,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Execution failed',
        },
        { status: 500 }
      );
    }

    console.log(`[API] BIAB execution completed successfully`);
    console.log(`[API] Completed prompts: ${result.executionsSummary?.completedPrompts}`);
    console.log(`[API] Total tokens: ${result.executionsSummary?.totalTokensUsed.toLocaleString()}`);

    // Log v0 deployment if available
    if (result.v0Deployment?.previewUrl) {
      console.log(`[API] v0 deployment: ${result.v0Deployment.previewUrl}`);
    }

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      summary: result.executionsSummary,
      executionIds: result.executionIds,
      v0: result.v0Deployment ? {
        chatId: result.v0Deployment.chatId,
        previewUrl: result.v0Deployment.previewUrl,
        deployUrl: result.v0Deployment.deployUrl,
        generatedAt: result.v0Deployment.generatedAt,
        status: result.v0Deployment.deployUrl ? 'deployed' : 'generated',
      } : undefined,
    });

  } catch (error) {
    console.error('[API] BIAB execution error:', error);

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

// ============================================
// GET HANDLER (Optional: Get execution status)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get execution summary
    const orchestrator = new BIABOrchestratorAgent();
    const summary = await orchestrator.getExecutionSummary(projectId);

    return NextResponse.json({
      success: true,
      projectId,
      summary,
    });

  } catch (error) {
    console.error('[API] Get execution summary error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: Execute Business in a Box
 *
 * POST /api/business-in-a-box/execute
 * Triggers the BIAB Orchestrator to execute all 16 prompts for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { BIABOrchestratorAgent } from '@/lib/agents/biab-orchestrator-agent';
import { BIABTier, PrismaClient } from '@/app/generated/prisma';
import { z } from 'zod';
import { sendProjectStartedEmail, sendProjectCompleteEmail } from '@/lib/email/postmark-client';
import { packageBIABDeliverables } from '@/lib/delivery/package-biab-deliverables';

// ============================================
// REQUEST SCHEMA
// ============================================

const ExecuteBIABSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  businessConcept: z.string().min(10, 'Business concept must be at least 10 characters'),
  userId: z.string().min(1, 'User ID is required'),
  tier: z.enum([BIABTier.VALIDATION_PACK, BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM]),
  contextIds: z.array(z.string()).optional(), // Optional: User context IDs for RAG enhancement
});

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = ExecuteBIABSchema.parse(body);

    console.log(`[API] BIAB execution request for project: ${validatedData.projectId}`);
    console.log(`[API] Tier: ${validatedData.tier}`);

    // ============================================
    // PAYMENT VERIFICATION
    // ============================================
    console.log(`[API] Verifying payment for ${validatedData.userId}...`);

    const payment = await prisma.payment.findFirst({
      where: {
        userId: validatedData.userId,
        tier: validatedData.tier,
        status: 'COMPLETED',
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (!payment) {
      console.error(`[API] ✗ No payment found for user ${validatedData.userId} with tier ${validatedData.tier}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment required',
          message: `No valid payment found for tier: ${validatedData.tier}`,
          code: 'PAYMENT_REQUIRED',
        },
        { status: 402 }
      );
    }

    console.log(`[API] ✓ Payment verified: ${payment.id} ($${payment.amount / 100})`);

    // Update payment with projectId
    if (!payment.projectId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { projectId: validatedData.projectId },
      });
      console.log(`[API] ✓ Linked payment to project: ${validatedData.projectId}`);
    }

    // ============================================
    // GET USER INFO FOR EMAILS
    // ============================================
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // ============================================
    // SEND PROJECT STARTED EMAIL
    // ============================================
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dashboardUrl = `${appUrl}/dashboard`;

    console.log('[API] Sending project started email...');
    const startedEmailResult = await sendProjectStartedEmail(
      { email: user.email!, name: user.name || undefined },
      {
        projectId: validatedData.projectId,
        projectName: validatedData.businessConcept.substring(0, 100), // Truncate if too long
        tier: validatedData.tier,
        dashboardUrl,
      }
    );

    if (startedEmailResult.success) {
      console.log(`[API] ✓ Started email sent to ${user.email}`);
    } else {
      console.warn(`[API] ⚠️  Failed to send started email: ${startedEmailResult.error}`);
      // Don't fail the request if email fails - continue with execution
    }

    // ============================================
    // EXECUTE BIAB ORCHESTRATOR
    // ============================================
    const orchestrator = new BIABOrchestratorAgent();
    const result = await orchestrator.execute({
      projectId: validatedData.projectId,
      businessConcept: validatedData.businessConcept,
      userId: validatedData.userId,
      tier: validatedData.tier,
      contextIds: validatedData.contextIds, // Pass context IDs for RAG enhancement
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

    // ============================================
    // CREATE DELIVERY PACKAGE AUTOMATICALLY
    // ============================================
    console.log('[API] Creating delivery package...');

    // Get project name
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { projectName: true },
    });

    const packageResult = await packageBIABDeliverables(
      validatedData.projectId,
      validatedData.userId,
      {
        tier: validatedData.tier,
        logoUrls: result.logoUrls,
        projectName: project?.projectName || validatedData.businessConcept.substring(0, 100),
      }
    );

    if (packageResult.success) {
      console.log(`[API] ✓ Package created: ${packageResult.packageId}`);
      console.log(`[API] ✓ Download URL: ${packageResult.downloadUrl}`);
      console.log(`[API] ✓ File size: ${((packageResult.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`);

      // ============================================
      // SEND PROJECT COMPLETE EMAIL
      // ============================================
      console.log('[API] Sending project complete email...');
      const completeEmailResult = await sendProjectCompleteEmail(
        { email: user.email!, name: user.name || undefined },
        {
          projectId: validatedData.projectId,
          projectName: project?.projectName || validatedData.businessConcept.substring(0, 100),
          tier: validatedData.tier,
          downloadUrl: packageResult.downloadUrl!,
          dashboardUrl,
          fileType: 'zip',
        }
      );

      if (completeEmailResult.success) {
        console.log(`[API] ✓ Complete email sent to ${user.email}`);
      } else {
        console.warn(`[API] ⚠️  Failed to send complete email: ${completeEmailResult.error}`);
        // Don't fail the request if email fails
      }
    } else {
      console.error(`[API] ✗ Package creation failed: ${packageResult.error}`);
      // Don't fail the request - user can still download from dashboard
    }

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      summary: result.executionsSummary,
      executionIds: result.executionIds,
      packageInfo: packageResult.success ? {
        packageId: packageResult.packageId,
        downloadUrl: packageResult.downloadUrl,
        expiresAt: packageResult.expiresAt,
        fileSize: packageResult.fileSize,
      } : undefined,
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
  } finally {
    await prisma.$disconnect();
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

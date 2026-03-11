/**
 * GET /api/projects/[id]/status
 *
 * Returns current project status for build progress polling.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        previewUrl: true,
        productionUrl: true,
        githubRepoUrl: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        userId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Also fetch deployed app info if it exists
    const deployedApp = await prisma.deployedApp.findUnique({
      where: { projectId },
      select: {
        hostingStatus: true,
        vercelProductionUrl: true,
        githubRepoUrl: true,
        stripeConnectOnboardingUrl: true,
        stripeConnectOnboarded: true,
        customDomain: true,
        domainVerified: true,
        provisioningLog: true,
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        previewUrl: project.previewUrl,
        productionUrl: project.productionUrl,
        githubRepoUrl: project.githubRepoUrl,
        errorMessage: project.errorMessage,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        completedAt: project.completedAt,
      },
      deployedApp: deployedApp
        ? {
            hostingStatus: deployedApp.hostingStatus,
            productionUrl: deployedApp.vercelProductionUrl,
            githubRepoUrl: deployedApp.githubRepoUrl,
            stripeConnectOnboardingUrl: deployedApp.stripeConnectOnboardingUrl,
            stripeConnectOnboarded: deployedApp.stripeConnectOnboarded,
            customDomain: deployedApp.customDomain,
            domainVerified: deployedApp.domainVerified,
            provisioningLog: deployedApp.provisioningLog,
          }
        : null,
    });
  } catch (error) {
    console.error("[projects/status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

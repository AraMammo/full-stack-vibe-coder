/**
 * POST /api/projects/[id]/build
 *
 * Triggers the build pipeline for a project.
 * Requires the project to have a completed industry profile (from conversation intake).
 *
 * Body (optional):
 *   { previewOnly?: boolean }
 *
 * The build runs async — returns immediately with status.
 * Client polls /api/projects/[id]/status for progress.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runBuild } from "@/lib/orchestrator/build-orchestrator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, status: true, industryProfile: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!project.industryProfile) {
      return NextResponse.json(
        { error: "Project has no industry profile. Complete the intake first." },
        { status: 400 }
      );
    }

    // Don't allow re-building a live project (use change requests instead)
    if (project.status === "LIVE") {
      return NextResponse.json(
        { error: "Project is already live. Use change requests to modify." },
        { status: 400 }
      );
    }

    // Don't allow concurrent builds
    if (project.status === "PROVISIONING") {
      return NextResponse.json(
        { error: "Build already in progress" },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const previewOnly = body.previewOnly === true;

    // Run build asynchronously — don't await
    runBuild({ projectId, previewOnly }).then((result) => {
      console.log(
        `[Build] Project ${projectId} ${result.success ? "succeeded" : "failed"}:`,
        result.success ? result.productionUrl : result.error
      );
    });

    return NextResponse.json({
      status: "building",
      projectId,
      message: previewOnly
        ? "Preview build started"
        : "Full build started. This takes 2-3 minutes.",
    });
  } catch (error) {
    console.error("[projects/build] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

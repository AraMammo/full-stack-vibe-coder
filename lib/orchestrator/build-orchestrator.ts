/**
 * Build Orchestrator
 *
 * Connects the conversation intake to the template engine and provisioning pipeline.
 *
 * Flow:
 * 1. Load project + extracted IndustryProfile
 * 2. Match to template from registry
 * 3. Build customized codebase via template engine
 * 4. Run OpenClaw refinement (optional, for paid builds)
 * 5. Hand off to provisioning pipeline (Neon, GitHub, Vercel, Stripe Connect)
 * 6. Update project status throughout
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma";
import { IndustryProfile, TemplateConfig } from "@/lib/templates/types";
import { buildFromTemplate } from "@/lib/templates/engine";
import { getTemplate } from "@/lib/templates/registry";
import {
  provisionInfrastructure,
  ProvisioningProgressCallback,
} from "@/lib/services/provisioning-pipeline";

export interface BuildInput {
  projectId: string;
  /** If true, skip provisioning and just return the template output */
  previewOnly?: boolean;
}

export interface BuildResult {
  success: boolean;
  projectId: string;
  productionUrl?: string;
  previewUrl?: string;
  githubRepoUrl?: string;
  stripeConnectOnboardingUrl?: string;
  error?: string;
}

export type BuildProgressCallback = (
  phase: string,
  status: "running" | "completed" | "failed",
  detail?: string
) => void;

/**
 * Run the full build pipeline for a project.
 */
export async function runBuild(
  input: BuildInput,
  onProgress?: BuildProgressCallback
): Promise<BuildResult> {
  const { projectId, previewOnly } = input;

  try {
    // ── Step 1: Load project ──────────────────────────────────
    onProgress?.("load_project", "running");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true, template: true },
    });

    if (!project) {
      return { success: false, projectId, error: "Project not found" };
    }

    if (!project.industryProfile) {
      return {
        success: false,
        projectId,
        error: "Project has no industry profile. Complete the intake conversation first.",
      };
    }

    const profile = project.industryProfile as unknown as IndustryProfile;
    onProgress?.("load_project", "completed");

    // ── Step 2: Match template ────────────────────────────────
    onProgress?.("match_template", "running");

    // Find template from conversation classification or project's linked template
    const conversation = await prisma.conversation.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    const classification = conversation?.extractedProfile as Record<string, unknown> | null;
    const templateSlug =
      project.template?.slug ||
      (classification?.classification as Record<string, unknown>)?.templateSlug as string ||
      "coaching"; // fallback to coaching for now

    const template = getTemplate(templateSlug);
    if (!template) {
      return {
        success: false,
        projectId,
        error: `No template found for slug: ${templateSlug}`,
      };
    }

    // Link template to project if not already linked
    if (!project.templateId) {
      const dbTemplate = await prisma.industryTemplate.findUnique({
        where: { slug: templateSlug },
      });
      if (dbTemplate) {
        await prisma.project.update({
          where: { id: projectId },
          data: { templateId: dbTemplate.id },
        });
      }
    }

    onProgress?.("match_template", "completed", template.name);

    // ── Step 3: Build from template ───────────────────────────
    onProgress?.("build_template", "running");

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "CUSTOMIZING" },
    });

    const config: TemplateConfig = {
      templateSlug,
      templatePath: template.templatePath,
      profile,
    };

    const templateResult = await buildFromTemplate(config);

    onProgress?.(
      "build_template",
      "completed",
      `${templateResult.files.size} files generated`
    );

    // ── Step 4: Preview-only mode ─────────────────────────────
    if (previewOnly) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: "PREVIEWING",
          customizations: JSON.parse(
            JSON.stringify({ fileCount: templateResult.files.size })
          ) as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        projectId,
        // Preview URL will be set by a separate preview deploy mechanism
      };
    }

    // ── Step 5: Provision infrastructure ──────────────────────
    onProgress?.("provision", "running");

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "PROVISIONING" },
    });

    const provisionCallback: ProvisioningProgressCallback = (
      step,
      status,
      data
    ) => {
      onProgress?.(`provision:${step}`, status, JSON.stringify(data));
    };

    const provisionResult = await provisionInfrastructure(
      {
        projectId,
        projectName: project.name,
        userId: project.userId,
        userEmail: project.user.email || "",
        codeFiles: templateResult.files,
        migrationSql: templateResult.migrationSql || undefined,
      },
      provisionCallback
    );

    if (!provisionResult.success) {
      onProgress?.("provision", "failed", provisionResult.error);
      return {
        success: false,
        projectId,
        error: provisionResult.error,
      };
    }

    onProgress?.("provision", "completed", provisionResult.productionUrl);

    // ── Step 6: Run seed SQL via Neon ─────────────────────────
    if (templateResult.seedSql) {
      onProgress?.("seed_database", "running");
      try {
        const deployedApp = await prisma.deployedApp.findUnique({
          where: { projectId },
        });
        if (deployedApp?.neonDatabaseUrl) {
          const { runMigration } = await import(
            "@/lib/services/neon-provisioning"
          );
          await runMigration(deployedApp.neonDatabaseUrl, templateResult.seedSql);
          onProgress?.("seed_database", "completed");
        }
      } catch (seedError) {
        // Non-fatal — app works, just no seed data
        console.error("[BuildOrchestrator] Seed failed:", seedError);
        onProgress?.("seed_database", "failed", String(seedError));
      }
    }

    return {
      success: true,
      projectId,
      productionUrl: provisionResult.productionUrl,
      githubRepoUrl: provisionResult.githubRepoUrl,
      stripeConnectOnboardingUrl: provisionResult.stripeConnectOnboardingUrl,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[BuildOrchestrator] Error:", errorMessage);

    // Mark project as failed
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });
    } catch {
      // swallow — primary error is more important
    }

    onProgress?.("build", "failed", errorMessage);
    return { success: false, projectId, error: errorMessage };
  }
}

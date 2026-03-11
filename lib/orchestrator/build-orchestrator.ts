/**
 * Build Orchestrator
 *
 * Connects the conversation intake to AI-powered code generation and provisioning.
 *
 * Flow:
 * 1. Load project + extracted IndustryProfile
 * 2. Resolve industry context from the 28 industry profiles
 * 3. Generate codebase via Claude with industry context injected
 * 4. Run OpenClaw refinement (optional, for paid builds)
 * 5. Hand off to provisioning pipeline (Neon, GitHub, Vercel, Stripe Connect)
 * 6. Update project status throughout
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma";
import { IndustryProfile } from "@/lib/templates/types";
import { getIndustryContext, getIndustryName } from "@/lib/industry/context-loader";
import { generateCodebase, CodegenInput } from "@/lib/services/claude-codegen";
import {
  provisionInfrastructure,
  ProvisioningProgressCallback,
} from "@/lib/services/provisioning-pipeline";

export interface BuildInput {
  projectId: string;
  /** If true, skip provisioning and just return the generated output */
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
      include: { user: true },
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

    // ── Step 2: Resolve industry context ────────────────────
    onProgress?.("resolve_industry", "running");

    const industrySlug = profile.industrySlug || "consultant_coach";
    const industryContext = getIndustryContext(industrySlug);
    const industryName = getIndustryName(industrySlug) || industrySlug;

    console.log(
      `[BuildOrchestrator] Industry: ${industryName} (${industrySlug})` +
      (industryContext ? ` — ${industryContext.length} chars of context loaded` : " — no context file found")
    );

    onProgress?.("resolve_industry", "completed", industryName);

    // ── Step 3: Generate codebase via Claude ─────────────────
    onProgress?.("generate_code", "running");

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "CUSTOMIZING" },
    });

    // Build the business concept from the profile
    const businessConcept = buildBusinessConcept(profile, industryName);

    // Build a brand identity summary from the profile
    const brandIdentity = buildBrandIdentity(profile);

    // Build the architecture + codebase spec with industry context
    const appArchitecture = buildArchitectureSpec(profile, industryName, industryContext);
    const codebaseSpec = buildCodebaseSpec(profile, industryName, industryContext);

    const codegenInput: CodegenInput = {
      projectName: profile.businessName || project.name,
      businessConcept,
      brandIdentity,
      appArchitecture,
      codebaseSpec,
    };

    const codegenResult = await generateCodebase(codegenInput);

    if (!codegenResult.success || !codegenResult.files) {
      onProgress?.("generate_code", "failed", codegenResult.error);
      return {
        success: false,
        projectId,
        error: `Code generation failed: ${codegenResult.error}`,
      };
    }

    onProgress?.(
      "generate_code",
      "completed",
      `${codegenResult.files.size} files generated`
    );

    // ── Step 4: Preview-only mode ─────────────────────────────
    if (previewOnly) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: "PREVIEWING",
          customizations: JSON.parse(
            JSON.stringify({ fileCount: codegenResult.files.size })
          ) as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        projectId,
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
        codeFiles: codegenResult.files,
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

// ── Helpers: Build prompts from profile + industry context ────────────────

function buildBusinessConcept(profile: IndustryProfile, industryName: string): string {
  const parts: string[] = [];

  parts.push(`Business: ${profile.businessName}`);
  parts.push(`Industry: ${industryName}`);

  if (profile.ownerName) parts.push(`Owner: ${profile.ownerName}`);
  if (profile.tagline) parts.push(`Tagline: ${profile.tagline}`);
  if (profile.about) parts.push(`About: ${profile.about}`);
  if (profile.phone) parts.push(`Phone: ${profile.phone}`);

  // Include industry-specific data
  if (profile.industryData && Object.keys(profile.industryData).length > 0) {
    parts.push(`\nIndustry-Specific Details:`);
    for (const [key, value] of Object.entries(profile.industryData)) {
      if (Array.isArray(value)) {
        parts.push(`  ${key}: ${value.join(", ")}`);
      } else if (typeof value === "object" && value !== null) {
        parts.push(`  ${key}: ${JSON.stringify(value)}`);
      } else {
        parts.push(`  ${key}: ${value}`);
      }
    }
  }

  // Legacy: include services/packages if present
  if (profile.services?.length) {
    parts.push(`\nServices:`);
    for (const s of profile.services) {
      parts.push(`  - ${s.name}: ${s.description} ($${(s.price / 100).toFixed(0)}, ${s.duration}min)`);
    }
  }
  if (profile.packages?.length) {
    parts.push(`\nPackages:`);
    for (const p of profile.packages) {
      parts.push(`  - ${p.name}: ${p.description} ($${(p.price / 100).toFixed(0)}, ${p.totalSessions} sessions)`);
    }
  }

  return parts.join("\n");
}

function buildBrandIdentity(profile: IndustryProfile): string {
  const parts: string[] = [];

  parts.push(`Brand Name: ${profile.businessName}`);
  parts.push(`Primary Color: ${profile.primaryColor}`);
  parts.push(`Accent Color: ${profile.accentColor}`);
  parts.push(`Timezone: ${profile.timezone}`);

  if (profile.tagline) parts.push(`Tagline: ${profile.tagline}`);

  if (profile.socialLinks) {
    for (const [platform, url] of Object.entries(profile.socialLinks)) {
      parts.push(`${platform}: ${url}`);
    }
  }

  return parts.join("\n");
}

function buildArchitectureSpec(
  profile: IndustryProfile,
  industryName: string,
  industryContext: string | null
): string {
  let spec = `Build a complete Next.js 14 web application for a ${industryName} business called "${profile.businessName}".

Tech stack:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v3
- Prisma ORM + PostgreSQL
- NextAuth.js (Google OAuth)
- Stripe (payments + subscriptions)

The app must include:
- Public-facing marketing pages (/, /about, /services, /contact)
- Authentication (NextAuth with Google provider)
- Customer dashboard
- Admin dashboard
- Stripe payment integration
- Mobile-responsive design
- SEO meta tags`;

  if (industryContext) {
    spec += `\n\n═══ INDUSTRY RESEARCH: ${industryName} ═══\nUse this research to inform the architecture. Build the features and workflows that THIS industry actually needs:\n\n${industryContext}`;
  }

  return spec;
}

function buildCodebaseSpec(
  profile: IndustryProfile,
  industryName: string,
  industryContext: string | null
): string {
  let spec = `Generate a complete Next.js 14 codebase for "${profile.businessName}" — a ${industryName} business.

Owner: ${profile.ownerName}
${profile.tagline ? `Tagline: ${profile.tagline}` : ""}
${profile.about ? `About: ${profile.about}` : ""}

Brand:
- Primary color: ${profile.primaryColor}
- Accent color: ${profile.accentColor}

Output EVERY file as:
\`\`\`filepath: path/to/file.ext
file contents
\`\`\`

Required files:
- package.json (with all dependencies)
- tsconfig.json
- next.config.js
- tailwind.config.ts (using brand colors)
- prisma/schema.prisma (with models for this industry)
- app/layout.tsx
- app/page.tsx (landing page — premium design, not generic)
- app/globals.css (with Tailwind directives + brand CSS variables)
- app/about/page.tsx
- app/contact/page.tsx
- components/Navigation.tsx
- components/Footer.tsx
- .env.example`;

  // Add industry-specific feature requirements
  if (profile.industryData && Object.keys(profile.industryData).length > 0) {
    spec += `\n\nIndustry-specific data to incorporate:\n`;
    for (const [key, value] of Object.entries(profile.industryData)) {
      spec += `- ${key}: ${JSON.stringify(value)}\n`;
    }
  }

  if (industryContext) {
    spec += `\n\n═══ INDUSTRY CONTEXT: ${industryName} ═══\nUse this to generate the RIGHT features, database schema, pages, and workflows for this type of business. Do NOT generate generic placeholder pages — build what this industry actually needs.\n\n${industryContext}`;
  }

  return spec;
}

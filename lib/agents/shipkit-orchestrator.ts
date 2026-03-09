/**
 * ShipKit Orchestrator Agent
 *
 * Executes ShipKit prompts based on selected tier with dependency management.
 * Transforms voice transcripts/chat input into complete startup packages.
 *
 * Replaces biab-orchestrator-agent.ts with ShipKit branding and
 * updated prompt IDs (sk_* prefix).
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '@/lib/ai-config';
import { PrismaClient, BIABTier } from '@/app/generated/prisma';
import { generateCodebase, type CodegenInput, parseCodebaseOutput } from '@/lib/services/claude-codegen';
import { provisionInfrastructure, type ProvisioningInput } from '@/lib/services/provisioning-pipeline';
import { deployStaticSite } from '@/lib/provisioning/staticDeploy';
import { runRefinementPipeline } from '@/lib/openclaw';

// ============================================
// TIER DISPLAY NAME MAPPING
// ============================================

export const TIER_DISPLAY_NAMES: Record<string, string> = {
  VALIDATION_PACK: 'ShipKit Lite',
  LAUNCH_BLUEPRINT: 'ShipKit Pro',
  TURNKEY_SYSTEM: 'ShipKit Complete',
  PRESENCE: 'ShipKit Presence',
};

// ============================================
// TYPES
// ============================================

export interface ShipKitExecutionInput {
  projectId: string;
  businessConcept: string;
  userId: string;
  tier: BIABTier;
  contextIds?: string[];
}

export interface ShipKitExecutionResult {
  success: boolean;
  projectId: string;
  tier: BIABTier;
  tierDisplayName: string;
  executionsSummary?: {
    totalPrompts: number;
    completedPrompts: number;
    totalTokensUsed: number;
    totalExecutionTimeMs: number;
    bySection: Record<string, number>;
  };
  executionIds?: number[];
  logoUrls?: string[];
  codegenResult?: {
    githubRepoName?: string;
    deploymentUrl?: string;
  };
  error?: string;
}

export type ProgressCallback = (update: {
  projectId: string;
  promptName: string;
  section: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  completedCount: number;
  totalCount: number;
}) => void;

interface PromptExecutionResult {
  promptId: number;
  promptName: string;
  output: string;
  tokensUsed: number;
  executionTimeMs: number;
}

// ============================================
// SHIPKIT ORCHESTRATOR
// ============================================

export class ShipKitOrchestrator {
  private anthropic: Anthropic;
  private prisma: PrismaClient;
  private model: string = CLAUDE_MODEL;
  private maxTokens: number = 4096;
  private progressCallback?: ProgressCallback;
  private userContextFormatted?: string;

  constructor(progressCallback?: ProgressCallback) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.prisma = new PrismaClient();
    this.progressCallback = progressCallback;
  }

  /**
   * Main execution flow
   */
  async execute(input: ShipKitExecutionInput): Promise<ShipKitExecutionResult> {
    const startTime = Date.now();
    const tierName = TIER_DISPLAY_NAMES[input.tier] || 'ShipKit';

    try {
      console.log(`[ShipKit] Starting execution for project ${input.projectId}`);
      console.log(`[ShipKit] Tier: ${tierName} (${input.tier})`);
      console.log(`[ShipKit] Business concept: ${input.businessConcept.substring(0, 100)}...`);

      // Load user context for RAG enhancement
      if (input.contextIds && input.contextIds.length > 0) {
        await this.loadUserContext(input.userId, input.contextIds, input.businessConcept);
      }

      // Load prompts for the selected tier
      const allPrompts = await this.prisma.promptTemplate.findMany({
        orderBy: { orderIndex: 'asc' },
      });

      const prompts = allPrompts.filter(p =>
        p.includedInTiers && p.includedInTiers.includes(input.tier)
      );

      console.log(`[ShipKit] Loaded ${prompts.length} prompts for ${tierName}`);

      // Track execution results
      const executionResults = new Map<string, PromptExecutionResult>();
      const executionIds: number[] = [];
      let totalTokensUsed = 0;
      const sectionCounts: Record<string, number> = {};

      // Execute each prompt
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const currentProgress = Math.round(((i + 1) / prompts.length) * 100);

        console.log(`\n[ShipKit] Executing: ${prompt.promptName} (${prompt.promptId})`);

        // Emit progress: in_progress
        if (this.progressCallback) {
          this.progressCallback({
            projectId: input.projectId,
            promptName: prompt.promptName,
            section: prompt.promptSection,
            status: 'in_progress',
            progress: currentProgress,
            completedCount: i,
            totalCount: prompts.length,
          });
        }

        const promptStartTime = Date.now();

        try {
          // Extract variables for PRESENCE landing page prompt
          let extraVars: Record<string, string> | undefined;
          if (input.tier === 'PRESENCE' && prompt.promptId === 'sk_landing_deploy_01') {
            extraVars = extractPresenceVariables(
              input.businessConcept,
              executionResults.get('sk_business_brief_01')?.output
            );
          }

          // Inject visual_dna into brand identity prompt if available
          if (prompt.promptId === 'sk_brand_identity_03') {
            const visualDna = await this.loadVisualDna(input.projectId);
            if (visualDna) {
              extraVars = extraVars || {};
              extraVars.visual_dna = `\n\n## Visual DNA (from reference screenshot)\n\n${visualDna}`;
            } else {
              extraVars = extraVars || {};
              extraVars.visual_dna = '';
            }
          }

          const resolvedInput = this.resolvePromptInput(
            prompt,
            input.businessConcept,
            executionResults,
            extraVars
          );

          const { output, tokensUsed } = await this.executePrompt(
            prompt.systemPrompt,
            resolvedInput
          );

          const executionTimeMs = Date.now() - promptStartTime;

          const execution = await this.prisma.promptExecution.create({
            data: {
              promptId: prompt.id,
              projectId: input.projectId,
              input: resolvedInput,
              output,
              tokensUsed,
              executionTimeMs,
              executedAt: new Date(),
            },
          });

          // Handle logo generation for brand identity prompt
          await this.handleLogoGeneration(execution, prompt.promptId, input.tier, input.projectId);

          executionIds.push(execution.id);
          totalTokensUsed += tokensUsed;
          sectionCounts[prompt.promptSection] = (sectionCounts[prompt.promptSection] || 0) + 1;

          executionResults.set(prompt.promptId, {
            promptId: prompt.id,
            promptName: prompt.promptName,
            output,
            tokensUsed,
            executionTimeMs,
          });

          console.log(`[ShipKit] Completed: ${prompt.promptName} (${tokensUsed} tokens, ${executionTimeMs}ms)`);

          // Emit progress: completed
          if (this.progressCallback) {
            this.progressCallback({
              projectId: input.projectId,
              promptName: prompt.promptName,
              section: prompt.promptSection,
              status: 'completed',
              progress: currentProgress,
              completedCount: i + 1,
              totalCount: prompts.length,
            });
          }

        } catch (error) {
          console.error(`[ShipKit] Failed: ${prompt.promptName}`, error);

          if (this.progressCallback) {
            this.progressCallback({
              projectId: input.projectId,
              promptName: prompt.promptName,
              section: prompt.promptSection,
              status: 'failed',
              progress: currentProgress,
              completedCount: i,
              totalCount: prompts.length,
            });
          }

          await this.prisma.promptExecution.create({
            data: {
              promptId: prompt.id,
              projectId: input.projectId,
              input: 'Error occurred during execution',
              output: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tokensUsed: 0,
              executionTimeMs: Date.now() - promptStartTime,
              status: 'failed',
              executedAt: new Date(),
            },
          });

          console.log(`[ShipKit] Continuing with next prompt...`);
        }
      }

      const totalExecutionTimeMs = Date.now() - startTime;

      console.log(`\n[ShipKit] Execution complete!`);
      console.log(`[ShipKit] ${executionResults.size}/${prompts.length} prompts completed`);
      console.log(`[ShipKit] Total tokens: ${totalTokensUsed.toLocaleString()}`);
      console.log(`[ShipKit] Total time: ${(totalExecutionTimeMs / 1000).toFixed(2)}s`);

      // For TURNKEY_SYSTEM tier: generate code + provision infrastructure
      let codegenResult: { githubRepoName?: string; deploymentUrl?: string } | undefined;

      if (input.tier === 'TURNKEY_SYSTEM') {
        console.log(`\n[ShipKit] Starting code generation + provisioning for Complete tier...`);

        try {
          // Gather inputs from prompt execution results
          const brandIdentity = executionResults.get('sk_brand_identity_03')?.output || '';
          const appArchitecture = executionResults.get('sk_app_architecture_07')?.output || '';
          const codebaseSpec = executionResults.get('sk_nextjs_codebase_08')?.output || '';

          // Generate the codebase
          const codeResult = await generateCodebase({
            projectName: input.businessConcept.substring(0, 100),
            businessConcept: input.businessConcept,
            brandIdentity,
            appArchitecture,
            codebaseSpec,
          });

          if (codeResult.success && codeResult.files && codeResult.files.size > 0) {
            // Run OpenClaw refinement pipeline (3 cycles, 4 agents each)
            let refinedFiles = codeResult.files;
            try {
              console.log(`[ShipKit] Running OpenClaw refinement (3 cycles)...`);
              const orchestratorOutputs: Record<string, string> = {};
              Array.from(executionResults.entries()).forEach(([key, result]) => {
                orchestratorOutputs[key] = result.output;
              });

              refinedFiles = await runRefinementPipeline(
                input.projectId,
                codeResult.files,
                orchestratorOutputs,
                (update) => {
                  this.prisma.project.update({
                    where: { id: input.projectId },
                    data: { codegenStatus: `refinement:cycle${update.cycle}:${update.phase}` },
                  }).catch((e: unknown) => console.warn(`[ShipKit] Failed to update refinement progress: ${e}`));
                },
              );
              console.log(`[ShipKit] OpenClaw refinement complete. ${refinedFiles.size} files refined.`);
            } catch (refinementError) {
              console.warn(`[ShipKit] OpenClaw refinement failed, proceeding with original files:`, refinementError);
              // Graceful fallback — use unrefined files
            }

            // Extract migration SQL from app architecture output
            const migrationSql = extractMigrationSql(appArchitecture);

            // Look up user email
            const user = await this.prisma.user.findFirst({
              where: { id: input.userId },
              select: { email: true },
            });

            // Run provisioning pipeline with progress updates
            const provisionResult = await provisionInfrastructure(
              {
                projectId: input.projectId,
                projectName: input.businessConcept.substring(0, 100),
                userId: input.userId,
                userEmail: user?.email || '',
                codeFiles: refinedFiles,
                migrationSql: migrationSql || undefined,
              },
              async (step, status) => {
                try {
                  await this.prisma.project.update({
                    where: { id: input.projectId },
                    data: { codegenStatus: `provisioning:${step}:${status}` },
                  });
                } catch (e) {
                  console.warn(`[ShipKit] Failed to update provisioning progress: ${e}`);
                }
              }
            );

            if (provisionResult.success) {
              codegenResult = {
                githubRepoName: provisionResult.githubRepoUrl,
                deploymentUrl: provisionResult.productionUrl,
              };
              console.log(`[ShipKit] Provisioning complete! Live at: ${provisionResult.productionUrl}`);
            } else {
              console.error(`[ShipKit] Provisioning failed: ${provisionResult.error}`);
              codegenResult = {
                githubRepoName: codeResult.githubRepoName,
                deploymentUrl: codeResult.vercelDeploymentUrl,
              };
            }
          } else {
            console.error('[ShipKit] Code generation produced no files');
          }
        } catch (codegenError) {
          console.error('[ShipKit] Code generation/provisioning failed:', codegenError);
        }
      }

      // For PRESENCE tier: parse landing page output and deploy static site
      if (input.tier === 'PRESENCE') {
        console.log(`\n[ShipKit] Starting static site deploy for Presence tier...`);

        try {
          const landingOutput = executionResults.get('sk_landing_deploy_01')?.output || '';
          const codeFiles = parseCodebaseOutput(landingOutput);

          if (codeFiles.size > 0) {
            // Run OpenClaw refinement pipeline for static sites too
            let refinedStaticFiles = codeFiles;
            try {
              console.log(`[ShipKit] Running OpenClaw refinement for Presence (3 cycles)...`);
              const orchestratorOutputs: Record<string, string> = {};
              Array.from(executionResults.entries()).forEach(([key, result]) => {
                orchestratorOutputs[key] = result.output;
              });

              refinedStaticFiles = await runRefinementPipeline(
                input.projectId,
                codeFiles,
                orchestratorOutputs,
                (update) => {
                  this.prisma.project.update({
                    where: { id: input.projectId },
                    data: { codegenStatus: `refinement:cycle${update.cycle}:${update.phase}` },
                  }).catch((e: unknown) => console.warn(`[ShipKit] Failed to update refinement progress: ${e}`));
                },
              );
              console.log(`[ShipKit] OpenClaw refinement complete for Presence.`);
            } catch (refinementError) {
              console.warn(`[ShipKit] OpenClaw refinement failed for Presence, proceeding with original files:`, refinementError);
            }

            const staticResult = await deployStaticSite({
              projectId: input.projectId,
              projectName: input.businessConcept.substring(0, 100),
              userId: input.userId,
              codeFiles: refinedStaticFiles,
            });

            if (staticResult.success) {
              codegenResult = {
                githubRepoName: staticResult.githubRepoName,
                deploymentUrl: staticResult.productionUrl,
              };
              console.log(`[ShipKit] Static site deployed: ${staticResult.productionUrl}`);
            } else {
              console.error(`[ShipKit] Static deploy failed: ${staticResult.error}`);
            }
          } else {
            console.error('[ShipKit] No files parsed from landing page output');
          }
        } catch (staticError) {
          console.error('[ShipKit] Static deploy error:', staticError);
        }
      }

      return {
        success: true,
        projectId: input.projectId,
        tier: input.tier,
        tierDisplayName: tierName,
        executionsSummary: {
          totalPrompts: prompts.length,
          completedPrompts: executionResults.size,
          totalTokensUsed,
          totalExecutionTimeMs,
          bySection: sectionCounts,
        },
        executionIds,
        codegenResult,
      };

    } catch (error) {
      console.error('[ShipKit] Execution failed:', error);
      return {
        success: false,
        projectId: input.projectId,
        tier: input.tier,
        tierDisplayName: tierName,
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private resolvePromptInput(
    prompt: any,
    businessConcept: string,
    executionResults: Map<string, PromptExecutionResult>,
    extraVariables?: Record<string, string>
  ): string {
    let resolvedPrompt = prompt.userPrompt;

    // Replace extra variables first (e.g. PRESENCE template variables)
    if (extraVariables) {
      for (const [key, value] of Object.entries(extraVariables)) {
        resolvedPrompt = resolvedPrompt.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          value || ''
        );
      }
    }

    resolvedPrompt = resolvedPrompt.replace(/\{\{business_concept\}\}/g, businessConcept);

    if (prompt.dependencies && prompt.dependencies.length > 0) {
      let dependencyContext = '\n\n# Context from Previous Analyses\n\n';

      for (const depPromptId of prompt.dependencies) {
        const depResult = executionResults.get(depPromptId);
        if (depResult) {
          dependencyContext += `## ${depResult.promptName}\n\n${depResult.output}\n\n---\n\n`;
        }
      }

      resolvedPrompt = `${resolvedPrompt}\n${dependencyContext}`;
    }

    resolvedPrompt = resolvedPrompt.replace(/\{\{[^}]+\}\}/g, businessConcept);

    return resolvedPrompt;
  }

  private async executePrompt(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ output: string; tokensUsed: number }> {
    let enhancedSystemPrompt = `${systemPrompt}

CRITICAL: Keep responses concise and actionable. Use structured formats (bullet points, tables) where appropriate. Focus on key insights and actionable recommendations. Deliver maximum value in minimal words.`;

    if (this.userContextFormatted) {
      enhancedSystemPrompt += `\n\n${this.userContextFormatted}`;
    }

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: 0.7,
      system: enhancedSystemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    return {
      output: content.text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  private async handleLogoGeneration(
    execution: any,
    promptId: string,
    tier: BIABTier,
    projectId: string
  ): Promise<void> {
    if (tier !== 'LAUNCH_BLUEPRINT' && tier !== 'TURNKEY_SYSTEM') return;
    // Trigger on brand identity prompt (either old or new ID)
    if (promptId !== 'sk_brand_identity_03' && promptId !== 'visual_identity_05') return;

    try {
      console.log('[ShipKit] Generating logos via Dumpling...');

      const imagePrompt = await this.createLogoPromptFromBrandStrategy(execution.output);
      const { generateLogos } = await import('../services/dumpling-client');
      const logoUrls = await generateLogos(imagePrompt, 5);

      console.log(`[ShipKit] Generated ${logoUrls.length} logos`);

      const logoSection = `\n\n## Generated Logo Files\n\n${logoUrls.map((url: string, i: number) =>
        `**Logo Variation ${i + 1}:**\n- Download: ${url}\n- File: logo-variation-${i + 1}.png\n`
      ).join('\n')}`;

      await this.prisma.promptExecution.update({
        where: { id: execution.id },
        data: { output: execution.output + logoSection },
      });

    } catch (error: any) {
      console.error('[ShipKit] Logo generation failed:', error.message);
      try {
        await this.prisma.promptExecution.update({
          where: { id: execution.id },
          data: {
            output: execution.output + `\n\n## Logo Generation\n\nLogo generation failed: ${error.message}\n\nPlease generate logos manually using the brand strategy above.`,
          },
        });
      } catch (updateError) {
        console.error('[ShipKit] Failed to update execution with error:', updateError);
      }
    }
  }

  private async createLogoPromptFromBrandStrategy(brandOutput: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Based on this brand strategy, create a concise image generation prompt (50-100 words) for a professional logo. Focus on visual style, colors, symbols, mood. Return ONLY the prompt as plain text.\n\n${brandOutput.substring(0, 2000)}`,
      }],
    });

    const imagePrompt = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    if (!imagePrompt || imagePrompt.length < 20) {
      throw new Error('Failed to generate valid image prompt');
    }
    return imagePrompt;
  }

  private async loadUserContext(
    userId: string,
    contextIds: string[],
    businessConcept: string
  ): Promise<void> {
    try {
      console.log(`[ShipKit] Loading user context (${contextIds.length} contexts)...`);
      const { retrieveRelevantContext, formatContextForPrompt } = await import('../services/rag-service');

      const retrievalResult = await retrieveRelevantContext(userId, businessConcept, {
        topK: 5,
        minSimilarity: 0.6,
        contextIds,
      });

      if (retrievalResult.chunks.length === 0) {
        this.userContextFormatted = undefined;
        return;
      }

      this.userContextFormatted = formatContextForPrompt(retrievalResult);
      console.log(`[ShipKit] Loaded ${retrievalResult.chunks.length} context chunks`);
    } catch (error: any) {
      console.error('[ShipKit] Failed to load user context:', error.message);
      this.userContextFormatted = undefined;
    }
  }

  /**
   * Load visual DNA from the project record if a reference screenshot was processed.
   */
  private async loadVisualDna(projectId: string): Promise<string | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { visualDna: true, referenceScreenshotUrl: true },
      });

      if (!project?.visualDna) {
        // If screenshot URL exists but no visual DNA yet, extract it now
        if (project?.referenceScreenshotUrl) {
          try {
            const { extractVisualDNA } = await import('@/lib/intake/visionAnalysis');
            const response = await fetch(project.referenceScreenshotUrl);
            const buffer = Buffer.from(await response.arrayBuffer());
            const result = await extractVisualDNA(buffer);

            await this.prisma.project.update({
              where: { id: projectId },
              data: { visualDna: result as any },
            });

            return result.raw;
          } catch (err) {
            console.error('[ShipKit] Visual DNA extraction failed:', err);
            return null;
          }
        }
        return null;
      }

      // visualDna is stored as JSON — extract the raw text
      const dna = project.visualDna as any;
      return dna.raw || JSON.stringify(dna);
    } catch (err) {
      console.error('[ShipKit] Failed to load visual DNA:', err);
      return null;
    }
  }

  async getExecutionSummary(projectId: string) {
    const executions = await this.prisma.promptExecution.findMany({
      where: { projectId },
      include: { prompt: true },
      orderBy: { executedAt: 'asc' },
    });

    const bySection: Record<string, number> = {};
    let totalTokens = 0;

    for (const execution of executions) {
      bySection[execution.prompt.promptSection] = (bySection[execution.prompt.promptSection] || 0) + 1;
      totalTokens += execution.tokensUsed;
    }

    return {
      totalExecutions: executions.length,
      totalTokens,
      bySection,
      executions: executions.map(e => ({
        id: e.id,
        promptName: e.prompt.promptName,
        promptSection: e.prompt.promptSection,
        tokensUsed: e.tokensUsed,
        executionTimeMs: e.executionTimeMs,
        executedAt: e.executedAt,
      })),
    };
  }
}

/**
 * Extract template variables for PRESENCE tier from the business brief output.
 * Pulls business name, value prop, audience, colors, and font from brief analysis.
 */
function extractPresenceVariables(
  businessConcept: string,
  briefOutput?: string
): Record<string, string> {
  const vars: Record<string, string> = {
    business_name: businessConcept.substring(0, 100),
    value_prop: '',
    target_audience: '',
    primary_color: '#2563eb', // default blue
    accent_color: '#f59e0b', // default amber
    font_pair: 'Inter, system-ui, sans-serif',
    visual_dna: '',
  };

  if (!briefOutput) return vars;

  // Extract business name (first suggested name)
  const nameMatch = briefOutput.match(/(?:^|\n)\s*(?:-\s*)?(?:Name:\s*)?(?:\*\*)?([A-Z][A-Za-z0-9\s&'.!-]{2,40})(?:\*\*)?/m);
  if (nameMatch) {
    vars.business_name = nameMatch[1].trim();
  }

  // Extract value proposition
  const vpMatch = briefOutput.match(/(?:Value Proposition|Solution)[:\s]*\n?[-*]?\s*(?:Solution[^:]*:\s*)?(.+)/i);
  if (vpMatch) {
    vars.value_prop = vpMatch[1].trim().substring(0, 200);
  }

  // Extract target audience
  const audienceMatch = briefOutput.match(/(?:Target Audience|Audience)[:\s]*\n?[-*]?\s*(?:Segment[^:]*:\s*)?(.+)/i);
  if (audienceMatch) {
    vars.target_audience = audienceMatch[1].trim().substring(0, 200);
  }

  // Extract color if mentioned
  const colorMatch = briefOutput.match(/#([0-9a-fA-F]{6})/);
  if (colorMatch) {
    vars.primary_color = `#${colorMatch[1]}`;
  }

  return vars;
}

/**
 * Extract SQL migration statements from the app architecture output.
 * Handles multiple code block formats and case-insensitive markers.
 */
function extractMigrationSql(architectureOutput: string): string | null {
  const blocks: string[] = [];
  let match;

  // Primary: case-insensitive match for sql/postgresql/pgsql code blocks
  const sqlBlockRegex = /```(?:sql|postgresql|pgsql)\s*\n([\s\S]*?)```/gi;
  while ((match = sqlBlockRegex.exec(architectureOutput)) !== null) {
    blocks.push(match[1].trim());
  }

  // Fallback: scan unlabeled code blocks for DDL keywords
  if (blocks.length === 0) {
    const unlabeledRegex = /```\s*\n([\s\S]*?)```/g;
    const ddlKeywords = /\b(CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+INDEX|CREATE\s+TYPE|CREATE\s+EXTENSION|INSERT\s+INTO|CREATE\s+OR\s+REPLACE\s+FUNCTION|CREATE\s+POLICY|ENABLE\s+ROW\s+LEVEL\s+SECURITY)/i;
    while ((match = unlabeledRegex.exec(architectureOutput)) !== null) {
      const content = match[1].trim();
      if (ddlKeywords.test(content)) {
        blocks.push(content);
      }
    }
  }

  if (blocks.length === 0) return null;

  // Safety: reject blocks containing destructive operations
  const safeBlocks = blocks.filter(block => {
    if (/\b(DROP\s+DATABASE|TRUNCATE\s+TABLE)\b/i.test(block)) {
      console.warn('[Orchestrator] Rejected SQL block containing DROP DATABASE or TRUNCATE TABLE');
      return false;
    }
    return true;
  });

  if (safeBlocks.length === 0) return null;

  console.log(`[Orchestrator] Extracted ${safeBlocks.length} SQL migration block(s)`);
  return safeBlocks.join('\n\n');
}

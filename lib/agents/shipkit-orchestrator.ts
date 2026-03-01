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
import { PrismaClient, BIABTier } from '@/app/generated/prisma';

// ============================================
// TIER DISPLAY NAME MAPPING
// ============================================

export const TIER_DISPLAY_NAMES: Record<string, string> = {
  VALIDATION_PACK: 'ShipKit Lite',
  LAUNCH_BLUEPRINT: 'ShipKit Pro',
  TURNKEY_SYSTEM: 'ShipKit Complete',
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
  private model: string = 'claude-sonnet-4-5-20250514';
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
          const resolvedInput = this.resolvePromptInput(
            prompt,
            input.businessConcept,
            executionResults
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
    executionResults: Map<string, PromptExecutionResult>
  ): string {
    let resolvedPrompt = prompt.userPrompt;
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
      model: 'claude-sonnet-4-5-20250514',
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

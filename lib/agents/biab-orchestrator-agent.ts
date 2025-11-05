/**
 * Business in a Box Orchestrator Agent
 *
 * Executes BIAB prompts based on selected tier with dependency management.
 * Transforms voice transcripts into complete startup packages.
 */

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient, BIABTier } from '@/app/generated/prisma';

// ============================================
// TYPES
// ============================================

export interface BIABExecutionInput {
  projectId: string;
  businessConcept: string; // Voice transcript or business description
  userId: string;
  tier: BIABTier; // Selected pricing tier
  contextIds?: string[]; // Optional: User context IDs for RAG enhancement
}

export interface BIABExecutionResult {
  success: boolean;
  projectId: string;
  tier: BIABTier;
  executionsSummary?: {
    totalPrompts: number;
    completedPrompts: number;
    totalTokensUsed: number;
    totalExecutionTimeMs: number;
    bySection: Record<string, number>; // section -> prompt count
  };
  executionIds?: number[];
  logoUrls?: string[]; // Tier 2+ only
  v0Deployment?: {
    chatId?: string;
    previewUrl?: string;
    deployUrl?: string;
    generatedAt?: Date;
  }; // Tier 2+ only (v0 integration)
  deploymentInfo?: {
    githubRepoUrl?: string;
    vercelDeploymentUrl?: string;
    supabaseProjectId?: string;
  }; // Tier 3 only
  error?: string;
}

// Type for SSE progress updates
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
// BIAB ORCHESTRATOR AGENT
// ============================================

export class BIABOrchestratorAgent {
  private anthropic: Anthropic;
  private prisma: PrismaClient;
  private model: string = 'claude-sonnet-4-5-20250929';
  private maxTokens: number = 2600; // Reduced from 8192 for 35% token reduction
  private progressCallback?: ProgressCallback;
  private userContextFormatted?: string; // Formatted user context for RAG injection

  constructor(progressCallback?: ProgressCallback) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.prisma = new PrismaClient();
    this.progressCallback = progressCallback;
  }

  /**
   * Main execution flow
   * Loads prompts for the selected tier, executes them sequentially with dependency resolution
   */
  async execute(input: BIABExecutionInput): Promise<BIABExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`[BIAB Orchestrator] Starting execution for project ${input.projectId}`);
      console.log(`[BIAB Orchestrator] Tier: ${input.tier}`);
      console.log(`[BIAB Orchestrator] Business concept: ${input.businessConcept.substring(0, 100)}...`);

      // Load and format user context for RAG enhancement (if provided)
      if (input.contextIds && input.contextIds.length > 0) {
        await this.loadUserContext(input.userId, input.contextIds, input.businessConcept);
      }

      // Load prompts for the selected tier, ordered by execution order
      const allPrompts = await this.prisma.promptTemplate.findMany({
        orderBy: { orderIndex: 'asc' },
      });

      // Filter prompts by tier
      const prompts = allPrompts.filter(p =>
        p.includedInTiers && p.includedInTiers.includes(input.tier)
      );

      console.log(`[BIAB Orchestrator] Loaded ${prompts.length} prompts for tier ${input.tier}`);

      // Track execution results for dependency resolution
      const executionResults = new Map<string, PromptExecutionResult>();
      const executionIds: number[] = [];
      let totalTokensUsed = 0;
      const sectionCounts: Record<string, number> = {};

      // Execute each prompt in order
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const currentProgress = Math.round(((i + 1) / prompts.length) * 100);

        console.log(`\n[BIAB Orchestrator] Executing: ${prompt.promptName} (${prompt.promptId})`);
        console.log(`[BIAB Orchestrator] Dependencies: ${prompt.dependencies.join(', ') || 'None'}`);

        // Emit progress update: in_progress
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
          // Build input by resolving dependencies
          const resolvedInput = this.resolvePromptInput(
            prompt,
            input.businessConcept,
            executionResults
          );

          // Execute prompt with Claude
          const { output, tokensUsed } = await this.executePrompt(
            prompt.systemPrompt,
            resolvedInput
          );

          const executionTimeMs = Date.now() - promptStartTime;

          // Save execution to database
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

          // Handle logo generation if this is visual_identity_05 for LAUNCH_BLUEPRINT/TURNKEY tiers
          await this.handleLogoGeneration(execution, prompt.promptId, input.tier, input.projectId);

          // Handle v0 deployment if this is replit_site_16 for LAUNCH_BLUEPRINT/TURNKEY tiers
          await this.handleV0Deployment(execution, prompt.promptId, input.tier, input.projectId);

          executionIds.push(execution.id);
          totalTokensUsed += tokensUsed;

          // Track section counts
          sectionCounts[prompt.promptSection] = (sectionCounts[prompt.promptSection] || 0) + 1;

          // Store result for downstream dependencies
          executionResults.set(prompt.promptId, {
            promptId: prompt.id,
            promptName: prompt.promptName,
            output,
            tokensUsed,
            executionTimeMs,
          });

          console.log(`[BIAB Orchestrator] ✓ Completed: ${prompt.promptName}`);
          console.log(`[BIAB Orchestrator]   Tokens: ${tokensUsed}, Time: ${executionTimeMs}ms`);
          console.log(`[BIAB Orchestrator]   Output length: ${output.length} chars`);

          // Emit progress update: completed
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
          console.error(`[BIAB Orchestrator] ✗ Failed: ${prompt.promptName}`, error);

          // Emit progress update: failed
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

          // Save failed execution to database
          await this.prisma.promptExecution.create({
            data: {
              promptId: prompt.id,
              projectId: input.projectId,
              input: `Error occurred during execution`,
              output: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tokensUsed: 0,
              executionTimeMs: Date.now() - promptStartTime,
              status: 'failed',
              executedAt: new Date(),
            },
          });

          // Continue with next prompt (non-blocking failures)
          console.log(`[BIAB Orchestrator] Continuing with next prompt...`);
        }
      }

      const totalExecutionTimeMs = Date.now() - startTime;

      console.log(`\n[BIAB Orchestrator] ✓ Execution complete!`);
      console.log(`[BIAB Orchestrator] Total prompts: ${prompts.length}`);
      console.log(`[BIAB Orchestrator] Completed: ${executionResults.size}`);
      console.log(`[BIAB Orchestrator] Total tokens: ${totalTokensUsed.toLocaleString()}`);
      console.log(`[BIAB Orchestrator] Total time: ${(totalExecutionTimeMs / 1000).toFixed(2)}s`);
      console.log(`[BIAB Orchestrator] By section:`, sectionCounts);

      // Query project to get v0 deployment info for the result
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId },
      });

      const result: BIABExecutionResult = {
        success: true,
        projectId: input.projectId,
        tier: input.tier,
        executionsSummary: {
          totalPrompts: prompts.length,
          completedPrompts: executionResults.size,
          totalTokensUsed,
          totalExecutionTimeMs,
          bySection: sectionCounts,
        },
        executionIds,
      };

      // Add v0 deployment info if available
      if (project?.v0ChatId) {
        result.v0Deployment = {
          chatId: project.v0ChatId,
          previewUrl: project.v0PreviewUrl || undefined,
          deployUrl: project.v0DeployUrl || undefined,
          generatedAt: project.v0GeneratedAt || undefined,
        };
        console.log(`[BIAB Orchestrator] v0 deployment included in result: ${project.v0PreviewUrl}`);
      }

      return result;

    } catch (error) {
      console.error('[BIAB Orchestrator] Execution failed:', error);
      return {
        success: false,
        projectId: input.projectId,
        tier: input.tier,
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Resolve prompt input by injecting business concept and dependency outputs
   */
  private resolvePromptInput(
    prompt: any,
    businessConcept: string,
    executionResults: Map<string, PromptExecutionResult>
  ): string {
    let resolvedPrompt = prompt.userPrompt;

    // Inject business concept into placeholder
    resolvedPrompt = resolvedPrompt.replace(/\{\{business_concept\}\}/g, businessConcept);

    // Resolve dependency outputs
    if (prompt.dependencies && prompt.dependencies.length > 0) {
      let dependencyContext = '\n\n# Context from Previous Analyses\n\n';

      for (const depPromptId of prompt.dependencies) {
        const depResult = executionResults.get(depPromptId);
        if (depResult) {
          dependencyContext += `## ${depResult.promptName}\n\n${depResult.output}\n\n---\n\n`;
        }
      }

      // Append dependency context to the prompt
      resolvedPrompt = `${resolvedPrompt}\n${dependencyContext}`;
    }

    // Replace any remaining placeholders with business concept
    resolvedPrompt = resolvedPrompt.replace(/\{\{[^}]+\}\}/g, businessConcept);

    return resolvedPrompt;
  }

  /**
   * Execute a single prompt with Claude
   */
  private async executePrompt(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ output: string; tokensUsed: number }> {
    // Add conciseness directive to system prompt
    let enhancedSystemPrompt = `${systemPrompt}

CRITICAL: Keep responses concise and actionable. Use structured formats (bullet points, tables) where appropriate. Focus on key insights and actionable recommendations over exhaustive analysis. Deliver maximum value in minimal words.`;

    // Inject user context if available (RAG enhancement)
    if (this.userContextFormatted) {
      enhancedSystemPrompt += `\n\n${this.userContextFormatted}`;
    }

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: 0.7,
      system: enhancedSystemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
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

  /**
   * Handle logo generation for LAUNCH_BLUEPRINT and TURNKEY_SYSTEM tiers
   * Triggered after visual_identity_05 prompt execution
   */
  private async handleLogoGeneration(
    execution: any,
    promptId: string,
    tier: BIABTier,
    projectId: string
  ): Promise<void> {
    // Only generate logos for LAUNCH_BLUEPRINT and TURNKEY_SYSTEM
    if (tier !== 'LAUNCH_BLUEPRINT' && tier !== 'TURNKEY_SYSTEM') {
      return;
    }

    // Only trigger on visual_identity_05 prompt
    if (promptId !== 'visual_identity_05') {
      return;
    }

    try {
      console.log('[BIAB Orchestrator] 🎨 Generating logos via Dumpling...');

      // Step 1: Extract brand details and create image prompt
      const imagePrompt = await this.createLogoPromptFromBrandStrategy(execution.output);

      // Step 2: Generate 5 logo variations via Dumpling
      const { generateLogos } = await import('../services/dumpling-client');
      const logoUrls = await generateLogos(imagePrompt, 5);

      console.log(`[BIAB Orchestrator] ✓ Generated ${logoUrls.length} logos`);

      // Step 3: Append logo URLs to execution output
      const logoSection = `\n\n## Generated Logo Files\n\n${logoUrls.map((url, i) =>
        `**Logo Variation ${i + 1}:**\n- Download: ${url}\n- File: logo-variation-${i + 1}.png\n`
      ).join('\n')}`;

      // Update the execution in database
      await this.prisma.promptExecution.update({
        where: { id: execution.id },
        data: {
          output: execution.output + logoSection
        }
      });

      console.log('[BIAB Orchestrator] ✓ Logo URLs added to visual identity output');

    } catch (error: any) {
      console.error('[BIAB Orchestrator] ✗ Logo generation failed:', error.message);
      // Don't fail entire execution - add error note to output
      try {
        await this.prisma.promptExecution.update({
          where: { id: execution.id },
          data: {
            output: execution.output + `\n\n## Logo Generation\n\n⚠️ Logo generation failed: ${error.message}\n\nPlease contact support or generate logos manually using the brand strategy above.`
          }
        });
      } catch (updateError) {
        console.error('[BIAB Orchestrator] Failed to update execution with error:', updateError);
      }
    }
  }

  /**
   * Create focused image prompt from brand strategy output
   */
  private async createLogoPromptFromBrandStrategy(brandOutput: string): Promise<string> {
    try {
      console.log('[BIAB Orchestrator] Creating logo image prompt from brand strategy...');

      // Use Claude to extract key brand elements and create focused image prompt
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Based on this brand strategy output, create a concise image generation prompt (50-100 words) for creating a professional logo design.

Focus on:
- Visual style (modern, minimal, playful, corporate, etc.)
- Color palette (specific colors mentioned)
- Key symbols, icons, or visual metaphors
- Mood and tone
- Industry-appropriate aesthetics

DO NOT include:
- Company name or any text
- Specific dimensions or file formats
- Technical specifications

Return ONLY the image prompt as plain text, nothing else.

Brand Strategy Output:
${brandOutput.substring(0, 2000)}` // Limit to first 2000 chars
        }]
      });

      const imagePrompt = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : '';

      console.log('[BIAB Orchestrator] Created logo prompt:', imagePrompt.substring(0, 100) + '...');

      if (!imagePrompt || imagePrompt.length < 20) {
        throw new Error('Failed to generate valid image prompt from brand strategy');
      }

      return imagePrompt;

    } catch (error: any) {
      console.error('[BIAB Orchestrator] Failed to create logo prompt:', error.message);
      throw new Error(`Logo prompt generation failed: ${error.message}`);
    }
  }

  /**
   * Handle v0 deployment for LAUNCH_BLUEPRINT and TURNKEY_SYSTEM tiers
   * Triggered after replit_site_16 prompt execution
   */
  private async handleV0Deployment(
    execution: any,
    promptId: string,
    tier: BIABTier,
    projectId: string
  ): Promise<void> {
    // Only deploy for LAUNCH_BLUEPRINT and TURNKEY_SYSTEM
    if (tier !== 'LAUNCH_BLUEPRINT' && tier !== 'TURNKEY_SYSTEM') {
      return;
    }

    // Only trigger on replit_site_16 prompt
    if (promptId !== 'replit_site_16') {
      return;
    }

    try {
      console.log('[BIAB Orchestrator] 🚀 Deploying to v0...');

      // Import v0 client and brand extractor
      const { generateV0App, formatReplitPromptForV0 } = await import('../services/v0-client');
      const { extractBrandStrategy, formatBrandStrategyForV0 } = await import('../services/brand-strategy-extractor');

      // Step 1: Extract brand strategy from visual_identity_05
      console.log('[BIAB Orchestrator] Extracting brand strategy...');
      const brandStrategy = await extractBrandStrategy(projectId);

      // Step 2: Validate logo URLs if present
      if (brandStrategy?.logos?.primary) {
        console.log('[BIAB Orchestrator] Validating logo URLs...');
        const { checkUrlAccessible } = await import('../services/brand-strategy-extractor');

        const logoAccessible = await checkUrlAccessible(brandStrategy.logos.primary);
        if (!logoAccessible) {
          console.warn(`[BIAB Orchestrator] ⚠️  Primary logo URL not accessible: ${brandStrategy.logos.primary}`);
          console.warn('[BIAB Orchestrator] v0 may not be able to display the logo');
        } else {
          console.log(`[BIAB Orchestrator] ✓ Logo URL verified: ${brandStrategy.logos.primary}`);
        }
      }

      // Step 3: Extract and format the prompt
      const replitPrompt = formatReplitPromptForV0(execution.output);

      console.log(`[BIAB Orchestrator] Formatted prompt length: ${replitPrompt.length} characters`);

      // Step 4: Build custom system prompt with brand strategy
      let systemPrompt = 'You are an expert full-stack developer. Build a production-ready Next.js application based on the requirements provided. Use modern best practices, TypeScript, and Tailwind CSS.';

      if (brandStrategy) {
        const brandInstructions = formatBrandStrategyForV0(brandStrategy);
        systemPrompt += brandInstructions;
        console.log('[BIAB Orchestrator] ✓ Brand strategy added to system prompt');
        if (brandStrategy.logos?.variations.length) {
          console.log(`[BIAB Orchestrator]   Logos: ${brandStrategy.logos.variations.length} variations`);
        }
        console.log(`[BIAB Orchestrator]   Colors: ${brandStrategy.colors.all.length} found`);
        console.log(`[BIAB Orchestrator]   Fonts: ${brandStrategy.typography.all.length} found`);
      } else {
        console.log('[BIAB Orchestrator] ⚠️  No brand strategy found, using default system prompt');
      }

      // Step 4: Generate app via v0
      const v0Result = await generateV0App({
        prompt: replitPrompt,
        systemPrompt, // Include brand strategy
        chatPrivacy: 'private', // Keep private by default
        waitForCompletion: true, // Wait for generation to complete (up to 60 seconds)
      });

      if (!v0Result.success) {
        throw new Error(v0Result.error || 'v0 deployment failed');
      }

      console.log(`[BIAB Orchestrator] ✓ v0 deployment successful`);
      console.log(`[BIAB Orchestrator]   Chat ID: ${v0Result.chatId}`);
      console.log(`[BIAB Orchestrator]   Web URL: ${v0Result.webUrl}`);

      // Step 3: Append deployment URLs to execution output
      const deploymentSection = `\n\n## 🚀 Live Deployment\n\nYour application has been automatically deployed to v0!\n\n**Preview & Edit:**\n- URL: ${v0Result.webUrl}\n- Chat ID: ${v0Result.chatId}\n- Status: ${v0Result.metadata?.status || 'completed'}\n\n${v0Result.demoUrl ? `**Live Demo:**\n- URL: ${v0Result.demoUrl}\n\n` : ''}**Next Steps:**\n1. Visit the preview URL to see your application\n2. Use the chat interface to make refinements\n3. Click "Deploy" in v0 to publish to Vercel\n4. Customize the code using the Replit prompt above\n\n**Note:** The v0 chat is private and only accessible to you.`;

      // Update the execution in database
      await this.prisma.promptExecution.update({
        where: { id: execution.id },
        data: {
          output: execution.output + deploymentSection,
        },
      });

      // Step 4: Store v0 URLs in Project table
      try {
        await this.prisma.project.update({
          where: { id: projectId },
          data: {
            v0ChatId: v0Result.chatId,
            v0PreviewUrl: v0Result.webUrl,
            v0DeployUrl: v0Result.demoUrl,
            v0GeneratedAt: new Date(),
          },
        });
        console.log('[BIAB Orchestrator] ✓ v0 URLs stored in Project table');
      } catch (dbError) {
        console.error('[BIAB Orchestrator] Failed to store v0 URLs in database:', dbError);
      }

      console.log('[BIAB Orchestrator] ✓ v0 deployment info added to output');

    } catch (error: any) {
      console.error('[BIAB Orchestrator] ✗ v0 deployment failed:', error.message);

      // Don't fail entire execution - add error note to output
      try {
        await this.prisma.promptExecution.update({
          where: { id: execution.id },
          data: {
            output: execution.output + `\n\n## v0 Deployment\n\n⚠️ Automatic deployment to v0 failed: ${error.message}\n\nYou can still use the Replit prompt above to build the application manually, or deploy it to v0 yourself by visiting https://v0.dev and pasting the prompt.`,
          },
        });
      } catch (updateError) {
        console.error('[BIAB Orchestrator] Failed to update execution with error:', updateError);
      }
    }
  }

  /**
   * Load and format user context for RAG enhancement
   * Retrieves relevant context chunks based on business concept query
   */
  private async loadUserContext(
    userId: string,
    contextIds: string[],
    businessConcept: string
  ): Promise<void> {
    try {
      console.log(`[BIAB Orchestrator] Loading user context (${contextIds.length} contexts)...`);

      // Import RAG service dynamically
      const { retrieveRelevantContext, formatContextForPrompt } = await import('../services/rag-service');

      // Retrieve top 5 most relevant chunks based on business concept
      const retrievalResult = await retrieveRelevantContext(
        userId,
        businessConcept,
        {
          topK: 5,
          minSimilarity: 0.6,
          contextIds, // Limit to specified contexts
        }
      );

      if (retrievalResult.chunks.length === 0) {
        console.log('[BIAB Orchestrator] No relevant context found');
        this.userContextFormatted = undefined;
        return;
      }

      // Format context for injection into prompts
      this.userContextFormatted = formatContextForPrompt(retrievalResult);

      console.log(`[BIAB Orchestrator] ✓ Loaded ${retrievalResult.chunks.length} relevant context chunks`);
      console.log(`[BIAB Orchestrator] Context size: ${this.userContextFormatted.length} chars`);

    } catch (error: any) {
      console.error('[BIAB Orchestrator] ✗ Failed to load user context:', error.message);
      // Don't fail execution - just skip context enhancement
      this.userContextFormatted = undefined;
    }
  }

  /**
   * Get execution summary for a project
   */
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

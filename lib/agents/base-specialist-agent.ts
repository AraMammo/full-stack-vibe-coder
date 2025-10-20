/**
 * Base Specialist Agent Class
 *
 * Abstract base class for specialist agents (Frontend, Backend, Design, Content, etc.)
 * Handles task execution, context loading, and artifact creation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export interface TaskExecutionContext {
  // Task being executed
  task: {
    id: string;
    title: string;
    description: string;
    agentName: string;
    phase: string | null;
    input: any; // Task-specific input data
    dependsOn: string[];
  };

  // Project context
  project: {
    id: string;
    name: string;
    description: string;
    proposalContent: any; // Original proposal
    techStack: {
      frontend?: string[];
      backend?: string[];
      database?: string[];
      hosting?: string[];
    };
  };

  // Dependency outputs
  dependencies: {
    taskId: string;
    title: string;
    artifacts: Array<{
      id: string;
      fileName: string;
      filePath: string;
      content: string;
      artifactType: string;
    }>;
  }[];
}

export interface TaskArtifact {
  artifactType: 'component' | 'api_route' | 'schema' | 'config' | 'documentation' | 'asset';
  fileName: string;
  filePath: string;
  content: string;
  language?: string;
  framework?: string;
}

export interface SpecialistAgentResult {
  success: boolean;
  artifacts?: TaskArtifact[];
  summary?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    executionTimeMs?: number;
  };
}

export interface SpecialistAgentConfig {
  name: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================
// BASE SPECIALIST AGENT
// ============================================

export abstract class BaseSpecialistAgent {
  protected anthropic: Anthropic;
  protected config: Required<SpecialistAgentConfig>;

  constructor(config: SpecialistAgentConfig) {
    this.config = {
      name: config.name,
      model: config.model || 'claude-sonnet-4.5-20250929',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 8192,
    };

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Abstract method: Get system prompt for this specialist agent
   */
  abstract getSystemPrompt(): string;

  /**
   * Abstract method: Execute task and generate artifacts
   */
  abstract executeTask(context: TaskExecutionContext): Promise<SpecialistAgentResult>;

  /**
   * Main execution flow
   * Loads context, executes task, saves artifacts, updates task status
   */
  async run(taskId: string): Promise<SpecialistAgentResult> {
    const startTime = Date.now();

    try {
      console.log(`[${this.config.name}] Starting execution for task ${taskId}`);

      // Load execution context
      const context = await this.loadContext(taskId);

      // Update task status to in_progress
      await this.updateTaskStatus(taskId, 'in_progress');

      // Execute the task
      const result = await this.executeTask(context);

      if (!result.success) {
        await this.updateTaskStatus(taskId, 'failed', result.error);
        return result;
      }

      // Save artifacts to database
      if (result.artifacts && result.artifacts.length > 0) {
        await this.saveArtifacts(taskId, context.project.id, result.artifacts);
      }

      // Update task status to completed
      await this.updateTaskStatus(taskId, 'completed', undefined, {
        summary: result.summary,
        artifactCount: result.artifacts?.length || 0,
      });

      const executionTime = Date.now() - startTime;
      console.log(`[${this.config.name}] ✓ Task ${taskId} completed in ${executionTime}ms`);
      console.log(`[${this.config.name}] Generated ${result.artifacts?.length || 0} artifacts`);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTimeMs: executionTime,
        },
      };

    } catch (error) {
      console.error(`[${this.config.name}] Execution failed:`, error);

      await this.updateTaskStatus(
        taskId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load full execution context for a task
   */
  protected async loadContext(taskId: string): Promise<TaskExecutionContext> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            proposal: true,
            workflow: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Load dependency artifacts
    const dependencies = await Promise.all(
      task.dependsOn.map(async (depTaskId) => {
        const depTask = await prisma.task.findUnique({
          where: { id: depTaskId },
          include: { artifacts: true },
        });

        return {
          taskId: depTaskId,
          title: depTask?.title || 'Unknown',
          artifacts: depTask?.artifacts.map(a => ({
            id: a.id,
            fileName: a.fileName,
            filePath: a.filePath,
            content: a.content,
            artifactType: a.artifactType,
          })) || [],
        };
      })
    );

    // Extract tech stack from workflow context
    const workflowContext = task.project.workflow.context as any;
    const techStack = workflowContext?.scope?.techStack || {};

    return {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        agentName: task.agentName,
        phase: task.phase,
        input: task.input,
        dependsOn: task.dependsOn,
      },
      project: {
        id: task.project.id,
        name: task.project.name,
        description: task.project.description,
        proposalContent: task.project.proposal.content,
        techStack,
      },
      dependencies,
    };
  }

  /**
   * Call Claude API with context
   */
  protected async callClaude(userPrompt: string): Promise<{ content: string; usage: any }> {
    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.getSystemPrompt(),
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
      content: content.text,
      usage: response.usage,
    };
  }

  /**
   * Save artifacts to database
   */
  private async saveArtifacts(
    taskId: string,
    projectId: string,
    artifacts: TaskArtifact[]
  ): Promise<void> {
    for (const artifact of artifacts) {
      await prisma.taskArtifact.create({
        data: {
          taskId,
          projectId,
          artifactType: artifact.artifactType,
          fileName: artifact.fileName,
          filePath: artifact.filePath,
          content: artifact.content,
          agentName: this.config.name,
          language: artifact.language,
          framework: artifact.framework,
          fileSize: Buffer.byteLength(artifact.content, 'utf8'),
          linesOfCode: artifact.content.split('\n').length,
        },
      });

      console.log(`[${this.config.name}] Saved artifact: ${artifact.fileName}`);
    }
  }

  /**
   * Update task status in database
   */
  private async updateTaskStatus(
    taskId: string,
    status: string,
    errorMessage?: string,
    output?: any
  ): Promise<void> {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === 'in_progress' && { startedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(errorMessage && { output: { error: errorMessage } }),
        ...(output && !errorMessage && { output }),
      },
    });
  }

  /**
   * Helper: Parse JSON from Claude response
   */
  protected parseJSON<T>(content: string): T {
    // Try to find JSON in markdown code blocks
    const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonBlockMatch ? jsonBlockMatch[1].trim() : content.trim();

    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON:', jsonString);
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

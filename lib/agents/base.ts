/**
 * Base Agent Class
 *
 * Abstract base class for all AI agents in the system.
 * Handles common functionality like API calls, logging, and error handling.
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { AgentConfig, AgentResult, WorkflowState } from './types';
import { z } from 'zod';

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected anthropic: Anthropic;
  protected config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      name: config.name || 'base-agent',
      model: config.model || 'claude-sonnet-4.5-20250929',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 4096,
    };

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Abstract method that each agent must implement
   */
  abstract execute(state: WorkflowState): Promise<AgentResult<TOutput>>;

  /**
   * Abstract method that defines the system prompt for this agent
   */
  abstract getSystemPrompt(): string;

  /**
   * Abstract method for output validation schema
   */
  abstract getOutputSchema(): z.ZodSchema<TOutput>;

  /**
   * Call Claude API with the agent's system prompt and user input
   */
  protected async callClaude(
    userPrompt: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{ content: string; usage: any }> {
    const startTime = Date.now();

    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        system: options.systemPrompt || this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const executionTime = Date.now() - startTime;

      console.log(`[${this.config.name}] Claude API call completed in ${executionTime}ms`);
      console.log(`[${this.config.name}] Tokens used:`, response.usage);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      return {
        content: content.text,
        usage: response.usage,
      };
    } catch (error) {
      console.error(`[${this.config.name}] Claude API error:`, error);
      throw error;
    }
  }

  /**
   * Parse JSON from Claude's response, handling markdown code blocks
   */
  protected parseJSON<T>(text: string): T {
    // Remove markdown code blocks if present
    let jsonText = text.trim();

    // Remove ```json ... ``` or ``` ... ```
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error(`[${this.config.name}] Failed to parse JSON:`, text.substring(0, 200));
      throw new Error('Failed to parse agent output as JSON');
    }
  }

  /**
   * Validate output against schema
   */
  protected validateOutput(data: unknown): TOutput {
    try {
      const schema = this.getOutputSchema();
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`[${this.config.name}] Validation errors:`, error.errors);
        throw new Error(`Agent output validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Log agent step to database
   */
  protected async logStep(
    workflowId: string,
    stepOrder: number,
    status: 'running' | 'completed' | 'failed',
    data: {
      input?: any;
      output?: any;
      error?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      await prisma.workflowStep.upsert({
        where: {
          workflowId_stepOrder: {
            workflowId,
            stepOrder,
          },
        },
        create: {
          workflowId,
          agentName: this.config.name,
          stepOrder,
          status,
          input: data.input,
          output: data.output,
          metadata: data.metadata,
          errorMessage: data.error,
          startedAt: new Date(),
          ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {}),
        },
        update: {
          status,
          output: data.output,
          errorMessage: data.error,
          metadata: data.metadata,
          ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {}),
        },
      });
    } catch (error) {
      console.error(`[${this.config.name}] Failed to log step:`, error);
      // Don't throw - logging failures shouldn't break the workflow
    }
  }

  /**
   * Log agent message to database
   */
  protected async logMessage(
    workflowId: string,
    messageType: 'info' | 'error' | 'question' | 'response' | 'decision',
    content: any,
    toAgent?: string
  ): Promise<void> {
    try {
      await prisma.agentMessage.create({
        data: {
          workflowId,
          fromAgent: this.config.name,
          toAgent,
          messageType,
          content,
        },
      });
    } catch (error) {
      console.error(`[${this.config.name}] Failed to log message:`, error);
    }
  }

  /**
   * Update workflow status
   */
  protected async updateWorkflowStatus(
    workflowId: string,
    status: string,
    data: {
      currentStep?: string;
      context?: any;
      error?: string;
    } = {}
  ): Promise<void> {
    try {
      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          status,
          currentStep: data.currentStep,
          context: data.context,
          errorMessage: data.error,
          ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {}),
        },
      });
    } catch (error) {
      console.error(`[${this.config.name}] Failed to update workflow:`, error);
    }
  }

  /**
   * Execute agent with error handling and logging
   */
  async run(state: WorkflowState, stepOrder: number): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();

    console.log(`\n🤖 [${this.config.name}] Starting execution...`);

    // Log step as running
    await this.logStep(state.workflowId, stepOrder, 'running', {
      input: { transcript: state.transcript.substring(0, 200) + '...' },
    });

    // Update workflow current step
    await this.updateWorkflowStatus(state.workflowId, 'in_progress', {
      currentStep: this.config.name,
    });

    try {
      // Execute the agent
      const result = await this.execute(state);

      const executionTime = Date.now() - startTime;

      if (result.success) {
        console.log(`✓ [${this.config.name}] Completed successfully in ${executionTime}ms`);

        // Log successful completion
        await this.logStep(state.workflowId, stepOrder, 'completed', {
          output: result.data,
          metadata: {
            ...result.metadata,
            executionTimeMs: executionTime,
          },
        });

        await this.logMessage(state.workflowId, 'info', {
          message: `${this.config.name} completed successfully`,
          executionTimeMs: executionTime,
        });
      } else {
        console.error(`✗ [${this.config.name}] Failed: ${result.error}`);

        // Log failure
        await this.logStep(state.workflowId, stepOrder, 'failed', {
          error: result.error,
          metadata: {
            ...result.metadata,
            executionTimeMs: executionTime,
          },
        });

        await this.logMessage(state.workflowId, 'error', {
          message: `${this.config.name} failed`,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`✗ [${this.config.name}] Unexpected error:`, error);

      // Log error
      await this.logStep(state.workflowId, stepOrder, 'failed', {
        error: errorMessage,
        metadata: { executionTimeMs: executionTime },
      });

      await this.logMessage(state.workflowId, 'error', {
        message: `${this.config.name} encountered unexpected error`,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        metadata: { executionTimeMs: executionTime },
      };
    }
  }
}

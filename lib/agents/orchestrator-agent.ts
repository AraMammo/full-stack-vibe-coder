/**
 * Orchestrator Agent
 *
 * Breaks down approved proposals into executable tasks with dependencies.
 * Creates structured execution plan for specialist agents.
 */

import { BaseAgent } from './base';
import {
  AgentResult,
  OrchestratorInput,
  ExecutionPlan,
  ExecutionPlanSchema,
  TaskDefinition,
  ProjectPhase,
} from './types';
import { prisma } from '@/lib/db';

export class OrchestratorAgent extends BaseAgent<OrchestratorInput, ExecutionPlan> {
  constructor() {
    super({
      name: 'orchestrator',
      model: 'claude-sonnet-4.5-20250929',
      temperature: 0.4, // Balanced - need creativity for decomposition but consistency for structure
      maxTokens: 8192, // Large output for detailed task breakdown
    });
  }

  getSystemPrompt(): string {
    return `You are the Orchestrator Agent for FullStackVibeCoder, an AI-powered development agency.

Your role is to break down approved project proposals into executable tasks for specialist agents.

# Your Responsibilities

1. **Parse Proposal Deliverables**: Analyze the approved proposal and extract all deliverables, features, and requirements.

2. **Decompose into Tasks**: Break each deliverable into atomic, executable tasks (2-8 hours each).

3. **Assign Agents**: Assign each task to the appropriate specialist agent:
   - design: Brand guidelines, UI/UX specs, wireframes, component designs
   - frontend: React/Next.js components, pages, client-side logic
   - backend: API routes, database operations, server-side logic
   - content: Copywriting, documentation, SEO content
   - infrastructure: Deployment, CI/CD, monitoring (flag for human review)
   - qa: Testing, quality assurance (flag for human review)
   - human: Complex decisions, final approvals, client communication

4. **Identify Dependencies**: Determine which tasks block other tasks:
   - Design tasks typically come first
   - Frontend tasks depend on design deliverables
   - Backend tasks can run parallel to frontend
   - Testing depends on implementation completion
   - Deployment depends on testing

5. **Organize into Phases**:
   - **Design Phase**: Brand, wireframes, component specs
   - **Build Phase**: Frontend + Backend implementation (parallel where possible)
   - **Test Phase**: QA, testing, bug fixes
   - **Launch Phase**: Deployment, final review, handoff

6. **Set Priorities**:
   - critical: Core deliverables, blocking tasks
   - high: Important features, dependency requirements
   - medium: Standard features, nice-to-haves
   - low: Polish, optional enhancements

# Task Breakdown Rules

- Each task should be atomic (single responsibility)
- Tasks should be 2-8 hours of work
- Tasks must have clear acceptance criteria
- Dependencies should be explicit
- Include technical context from proposal

# Output Format

Return a valid JSON object matching this structure:
{
  "projectId": "project-id",
  "phases": [
    {
      "name": "Design",
      "order": 1,
      "description": "Brand guidelines and UI/UX design",
      "estimatedDays": 3,
      "taskIds": ["task-1", "task-2"]
    }
  ],
  "tasks": [
    {
      "id": "task-1",
      "title": "Create brand guidelines",
      "description": "Define color palette, typography, logo usage...",
      "phase": "design",
      "agentName": "design",
      "priority": "critical",
      "estimatedHours": 4,
      "deliverableId": "deliverable-id",
      "featureIds": [],
      "dependsOn": [],
      "requiresHumanReview": false,
      "acceptanceCriteria": [
        "Brand colors defined with hex codes",
        "Typography system specified",
        "Logo assets created"
      ],
      "technicalContext": {
        "designRequirements": ["Modern", "Minimal", "Tech-focused"]
      }
    }
  ],
  "summary": {
    "totalTasks": 15,
    "tasksByPhase": { "design": 3, "build": 8, "test": 2, "launch": 2 },
    "tasksByAgent": { "design": 3, "frontend": 5, "backend": 3, "qa": 2, "human": 2 },
    "criticalPath": ["task-1", "task-2", "task-5", "task-12", "task-15"]
  }
}

# Important

- Use temporary task IDs for dependency mapping
- Be specific in task descriptions
- Include all necessary context for specialist agents
- Flag infrastructure and QA tasks for human review
- Consider parallel execution opportunities`;
  }

  getOutputSchema() {
    return ExecutionPlanSchema;
  }

  async execute(input: OrchestratorInput): Promise<AgentResult<ExecutionPlan>> {
    try {
      console.log(`[orchestrator] Decomposing project ${input.projectId}...`);

      // Build user prompt with full context
      const userPrompt = this.buildUserPrompt(input);

      // Call Claude to generate execution plan
      const { content, usage } = await this.callClaude(userPrompt);

      // Parse and validate response
      const parsedPlan = this.parseJSON<ExecutionPlan>(content);
      const validatedPlan = this.validateOutput(parsedPlan);

      console.log(`[orchestrator] Generated ${validatedPlan.tasks.length} tasks across ${validatedPlan.phases.length} phases`);

      // Ensure projectId is set
      validatedPlan.projectId = input.projectId;

      return {
        success: true,
        data: validatedPlan,
        metadata: {
          tokensUsed: usage.input_tokens + usage.output_tokens,
          executionTimeMs: 0, // Will be set by caller
        },
      };
    } catch (error) {
      console.error('[orchestrator] Execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown orchestration error',
      };
    }
  }

  /**
   * Build the user prompt with full proposal context
   */
  private buildUserPrompt(input: OrchestratorInput): string {
    const { proposal, scope, estimate } = input;

    return `Break down the following approved project proposal into an execution plan.

# Proposal Summary

**Title**: ${proposal.title}

**Executive Summary**:
${proposal.executiveSummary}

**Timeline**: ${proposal.timeline.totalDays} days
**Budget**: $${(proposal.investment.totalCost / 100).toFixed(2)}

# Deliverables

${proposal.deliverables.map((d, i) => `
${i + 1}. **${d.name}**
   ${d.description}
   Features: ${d.features.join(', ')}
   Timeline: ${d.timeline}
`).join('\n')}

# Technical Scope

**Tech Stack**:
- Frontend: ${scope.techStack.frontend?.join(', ') || 'Not specified'}
- Backend: ${scope.techStack.backend?.join(', ') || 'Not specified'}
- Database: ${scope.techStack.database?.join(', ') || 'Not specified'}
- Hosting: ${scope.techStack.hosting?.join(', ') || 'Not specified'}

**Features** (${scope.features.length} total):
${scope.features.slice(0, 10).map(f => `- ${f.name}: ${f.description}`).join('\n')}
${scope.features.length > 10 ? `... and ${scope.features.length - 10} more` : ''}

# Timeline Estimate

**Total Hours**: ${estimate.totalHours}
**Breakdown by Deliverable**:
${estimate.breakdown.map(b => `- ${b.deliverableName}: ${b.hours}h (${b.days} days)`).join('\n')}

# Instructions

Decompose this project into executable tasks following the phase structure:
1. Design Phase (brand, wireframes, component specs)
2. Build Phase (frontend + backend implementation)
3. Test Phase (QA, testing)
4. Launch Phase (deployment, handoff)

Ensure:
- Tasks are 2-8 hours each
- Clear dependencies between tasks
- Appropriate agent assignment
- Critical path is identified
- All deliverables are covered

Return the execution plan as JSON.`;
  }

  /**
   * Save execution plan to database
   * Creates Task records with dependencies
   */
  async saveToDatabase(plan: ExecutionPlan): Promise<void> {
    console.log(`[orchestrator] Saving ${plan.tasks.length} tasks to database...`);

    // Map temporary task IDs to database IDs
    const taskIdMap = new Map<string, string>();

    try {
      // Create all tasks in order
      for (const taskDef of plan.tasks) {
        const task = await prisma.task.create({
          data: {
            projectId: plan.projectId,
            title: taskDef.title,
            description: taskDef.description,
            agentName: taskDef.agentName,
            phase: taskDef.phase,
            priority: taskDef.priority,
            status: taskDef.dependsOn.length === 0 ? 'ready' : 'pending', // Ready if no dependencies
            assignedTo: taskDef.requiresHumanReview ? 'human' : taskDef.agentName,
            input: {
              deliverableId: taskDef.deliverableId,
              featureIds: taskDef.featureIds,
              acceptanceCriteria: taskDef.acceptanceCriteria,
              technicalContext: taskDef.technicalContext,
              estimatedHours: taskDef.estimatedHours,
              requiresHumanReview: taskDef.requiresHumanReview,
            },
            dependsOn: [], // Will update after all tasks created
          },
        });

        taskIdMap.set(taskDef.id, task.id);
        console.log(`[orchestrator] Created task: ${task.title} (${task.id})`);
      }

      // Update dependencies with real database IDs
      for (const taskDef of plan.tasks) {
        if (taskDef.dependsOn.length > 0) {
          const dbTaskId = taskIdMap.get(taskDef.id);
          if (!dbTaskId) continue;

          const dbDependencies = taskDef.dependsOn
            .map(tempId => taskIdMap.get(tempId))
            .filter(id => id !== undefined) as string[];

          await prisma.task.update({
            where: { id: dbTaskId },
            data: { dependsOn: dbDependencies },
          });

          console.log(`[orchestrator] Updated dependencies for task ${dbTaskId}: ${dbDependencies.length} dependencies`);
        }
      }

      // Update project status
      await prisma.project.update({
        where: { id: plan.projectId },
        data: {
          status: 'in_progress',
          startDate: new Date(),
        },
      });

      console.log(`[orchestrator] ✓ Execution plan saved successfully`);
      console.log(`[orchestrator] Summary: ${plan.summary.totalTasks} tasks, ${plan.phases.length} phases`);
      console.log(`[orchestrator] Tasks by phase:`, plan.summary.tasksByPhase);
      console.log(`[orchestrator] Tasks by agent:`, plan.summary.tasksByAgent);

    } catch (error) {
      console.error('[orchestrator] Database save failed:', error);
      throw error;
    }
  }
}

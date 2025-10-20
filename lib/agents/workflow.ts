/**
 * Workflow Execution Engine
 *
 * Orchestrates the AI agent workflow from voice note to proposal.
 * Manages state, error handling, and database persistence.
 */

import { prisma } from '@/lib/db';
import { IntakeAgent } from './intake';
import { ScopeAgent } from './scope';
import { EstimatorAgent } from './estimator';
import { ProposalAgent } from './proposal';
import { WorkflowState } from './types';

export class WorkflowExecutor {
  private intakeAgent: IntakeAgent;
  private scopeAgent: ScopeAgent;
  private estimatorAgent: EstimatorAgent;
  private proposalAgent: ProposalAgent;

  constructor() {
    this.intakeAgent = new IntakeAgent();
    this.scopeAgent = new ScopeAgent();
    this.estimatorAgent = new EstimatorAgent();
    this.proposalAgent = new ProposalAgent();
  }

  /**
   * Execute the complete proposal generation workflow
   */
  async executeProposalWorkflow(workflowId: string): Promise<{
    success: boolean;
    proposalId?: string;
    error?: string;
  }> {
    console.log(`\n🚀 Starting workflow execution: ${workflowId}`);

    try {
      // Step 1: Load workflow data
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          voiceNote: true,
          user: true,
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.voiceNote.transcript) {
        throw new Error('Voice note has no transcript');
      }

      // Initialize workflow state
      const state: WorkflowState = {
        workflowId: workflow.id,
        userId: workflow.userId,
        voiceNoteId: workflow.voiceNoteId,
        transcript: workflow.voiceNote.transcript,
      };

      // Step 2: Run Intake Agent
      console.log('\n📋 Step 1/4: Running Intake Agent...');
      const intakeResult = await this.intakeAgent.run(state, 1);

      if (!intakeResult.success || !intakeResult.data) {
        await this.handleWorkflowFailure(workflowId, 'intake', intakeResult.error);
        return { success: false, error: `Intake failed: ${intakeResult.error}` };
      }

      state.requirements = intakeResult.data;

      // Step 3: Run Scope Agent
      console.log('\n📐 Step 2/4: Running Scope Agent...');
      const scopeResult = await this.scopeAgent.run(state, 2);

      if (!scopeResult.success || !scopeResult.data) {
        await this.handleWorkflowFailure(workflowId, 'scope', scopeResult.error);
        return { success: false, error: `Scope failed: ${scopeResult.error}` };
      }

      state.scope = scopeResult.data;

      // Step 4: Run Estimator Agent
      console.log('\n💰 Step 3/4: Running Estimator Agent...');
      const estimateResult = await this.estimatorAgent.run(state, 3);

      if (!estimateResult.success || !estimateResult.data) {
        await this.handleWorkflowFailure(workflowId, 'estimator', estimateResult.error);
        return { success: false, error: `Estimator failed: ${estimateResult.error}` };
      }

      state.estimate = estimateResult.data;

      // Step 5: Run Proposal Agent
      console.log('\n📄 Step 4/4: Running Proposal Agent...');
      const proposalResult = await this.proposalAgent.run(state, 4);

      if (!proposalResult.success || !proposalResult.data) {
        await this.handleWorkflowFailure(workflowId, 'proposal', proposalResult.error);
        return { success: false, error: `Proposal failed: ${proposalResult.error}` };
      }

      state.proposal = proposalResult.data;

      // Step 6: Save proposal to database
      console.log('\n💾 Saving proposal to database...');
      const proposal = await prisma.proposal.create({
        data: {
          workflowId: workflow.id,
          userId: workflow.userId,
          title: state.proposal.title,
          summary: state.proposal.executiveSummary,
          content: state.proposal,
          deliverables: state.proposal.deliverables,
          estimatedCost: state.proposal.investment.totalCost,
          estimatedDays: state.proposal.timeline.totalDays,
          breakdown: {
            costBreakdown: state.proposal.investment.breakdown,
            timelineBreakdown: state.proposal.timeline.milestones,
          },
          status: 'pending_review',
          version: 1,
        },
      });

      console.log(`✓ Proposal created: ${proposal.id}`);

      // Step 7: Update workflow as completed
      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          currentStep: 'completed',
          context: {
            requirements: state.requirements,
            scope: state.scope,
            estimate: state.estimate,
            proposal: state.proposal,
          },
        },
      });

      console.log(`\n🎉 Workflow completed successfully!`);
      console.log(`📊 Proposal ID: ${proposal.id}`);
      console.log(`💵 Total Cost: $${(proposal.estimatedCost / 100).toFixed(2)}`);
      console.log(`📅 Timeline: ${proposal.estimatedDays} days`);

      return {
        success: true,
        proposalId: proposal.id,
      };

    } catch (error) {
      console.error('\n❌ Workflow execution failed:', error);

      await this.handleWorkflowFailure(
        workflowId,
        'workflow',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle workflow failure
   */
  private async handleWorkflowFailure(
    workflowId: string,
    failedStep: string,
    error?: string
  ): Promise<void> {
    try {
      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          status: 'failed',
          currentStep: failedStep,
          errorMessage: error || 'Unknown error',
          completedAt: new Date(),
        },
      });

      // Log failure message
      await prisma.agentMessage.create({
        data: {
          workflowId,
          fromAgent: 'workflow-executor',
          messageType: 'error',
          content: {
            step: failedStep,
            error: error || 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (dbError) {
      console.error('Failed to log workflow failure:', dbError);
    }
  }

  /**
   * Get workflow status and progress
   */
  async getWorkflowStatus(workflowId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        proposal: true,
      },
    });

    if (!workflow) {
      return null;
    }

    // Calculate progress percentage
    const totalSteps = 4; // intake, scope, estimator, proposal
    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return {
      workflowId: workflow.id,
      status: workflow.status,
      currentStep: workflow.currentStep,
      progress,
      steps: workflow.steps.map(step => ({
        name: step.agentName,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
      })),
      proposal: workflow.proposal ? {
        id: workflow.proposal.id,
        title: workflow.proposal.title,
        status: workflow.proposal.status,
      } : null,
      error: workflow.errorMessage,
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
    };
  }
}

/**
 * Singleton instance
 */
export const workflowExecutor = new WorkflowExecutor();

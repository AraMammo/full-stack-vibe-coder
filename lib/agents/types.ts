/**
 * AI Agent Type Definitions
 *
 * Defines interfaces and types for the agent orchestration system.
 */

import { z } from 'zod';

// ============================================
// WORKFLOW STATE
// ============================================

/**
 * The complete state passed through the agent workflow
 */
export interface WorkflowState {
  workflowId: string;
  userId: string;
  voiceNoteId: string;
  transcript: string;

  // Agent outputs
  requirements?: BusinessRequirements;
  scope?: ProjectScope;
  estimate?: ProjectEstimate;
  proposal?: ProposalDocument;

  // Metadata
  currentStep?: string;
  errors?: string[];
  retryCount?: number;
}

// ============================================
// AGENT OUTPUTS
// ============================================

/**
 * Output from Intake Agent
 */
export interface BusinessRequirements {
  // Core business concept
  businessIdea: string;
  problemStatement: string;
  targetCustomer: string;
  uniqueValue: string;

  // Details
  industry?: string;
  businessModel?: string;
  budget?: {
    min?: number;
    max?: number;
    flexible: boolean;
  };

  // Branding preferences
  brandingPreferences?: {
    style?: string[];
    colors?: string[];
    inspiration?: string[];
  };

  // Technical requirements
  technicalRequirements?: {
    platforms?: string[]; // web, mobile, etc.
    integrations?: string[]; // stripe, email, etc.
    features?: string[];
  };

  // Ambiguities and questions
  clarificationNeeded?: {
    question: string;
    importance: 'high' | 'medium' | 'low';
  }[];

  // Confidence scores
  confidence: {
    overall: number; // 0-1
    hasClearGoal: boolean;
    hasTargetAudience: boolean;
    hasUniqueValue: boolean;
  };
}

/**
 * Output from Scope Agent
 */
export interface ProjectScope {
  // High-level deliverables
  deliverables: Deliverable[];

  // Detailed features
  features: Feature[];

  // Out of scope (explicitly)
  outOfScope: string[];

  // Technical stack recommendations
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    hosting?: string[];
    thirdParty?: string[];
  };

  // Assumptions
  assumptions: string[];

  // Dependencies and risks
  dependencies?: string[];
  risks?: {
    risk: string;
    mitigation: string;
  }[];
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: 'website' | 'branding' | 'marketing' | 'documentation' | 'integration' | 'other';
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'must-have' | 'should-have' | 'nice-to-have';
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  deliverableId: string; // Links to a deliverable
  complexity: 'simple' | 'medium' | 'complex';
  dependencies?: string[]; // IDs of other features
}

/**
 * Output from Estimator Agent
 */
export interface ProjectEstimate {
  // Total estimates
  totalCost: number; // in cents
  totalDays: number;
  totalHours: number;

  // Breakdown by deliverable
  breakdown: DeliverableEstimate[];

  // Timeline phases
  timeline: {
    phase: string;
    startDay: number;
    endDay: number;
    deliverables: string[]; // Deliverable IDs
  }[];

  // Cost breakdown
  costBreakdown: {
    labor: number;
    thirdPartyServices?: number;
    contingency: number; // Buffer for unknowns
  };

  // Confidence
  confidence: {
    overall: number; // 0-1
    notes: string[];
  };
}

export interface DeliverableEstimate {
  deliverableId: string;
  deliverableName: string;
  hours: number;
  cost: number; // in cents
  days: number;
  confidence: number; // 0-1
}

/**
 * Output from Proposal Agent
 */
export interface ProposalDocument {
  // Identification
  proposalId?: string; // Set after database creation
  version: number;

  // Executive Summary
  title: string;
  executiveSummary: string;

  // Client info recap
  clientGoals: string[];
  targetOutcome: string;

  // Deliverables (formatted for client)
  deliverables: {
    name: string;
    description: string;
    features: string[];
    timeline: string;
  }[];

  // Investment
  investment: {
    totalCost: number;
    breakdown: {
      item: string;
      cost: number;
    }[];
    paymentTerms: string;
  };

  // Timeline
  timeline: {
    totalDays: number;
    milestones: {
      name: string;
      day: number;
      deliverables: string[];
    }[];
  };

  // Next steps
  nextSteps: string[];

  // Terms
  terms?: string[];
}

// ============================================
// AGENT CONFIGURATION
// ============================================

export interface AgentConfig {
  name: string;
  model: string; // e.g., 'claude-sonnet-4.5-20250929'
  temperature: number;
  maxTokens: number;
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    executionTimeMs?: number;
    retryCount?: number;
  };
}

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

export const BusinessRequirementsSchema = z.object({
  businessIdea: z.string().min(10),
  problemStatement: z.string().min(10),
  targetCustomer: z.string().min(5),
  uniqueValue: z.string().min(10),
  industry: z.string().optional(),
  businessModel: z.string().optional(),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    flexible: z.boolean(),
  }).optional(),
  brandingPreferences: z.object({
    style: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    inspiration: z.array(z.string()).optional(),
  }).optional(),
  technicalRequirements: z.object({
    platforms: z.array(z.string()).optional(),
    integrations: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
  clarificationNeeded: z.array(z.object({
    question: z.string(),
    importance: z.enum(['high', 'medium', 'low']),
  })).optional(),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    hasClearGoal: z.boolean(),
    hasTargetAudience: z.boolean(),
    hasUniqueValue: z.boolean(),
  }),
});

export const ProjectScopeSchema = z.object({
  deliverables: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['website', 'branding', 'marketing', 'documentation', 'integration', 'other']),
    complexity: z.enum(['simple', 'medium', 'complex']),
    priority: z.enum(['must-have', 'should-have', 'nice-to-have']),
  })),
  features: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    deliverableId: z.string(),
    complexity: z.enum(['simple', 'medium', 'complex']),
    dependencies: z.array(z.string()).optional(),
  })),
  outOfScope: z.array(z.string()),
  techStack: z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    database: z.array(z.string()).optional(),
    hosting: z.array(z.string()).optional(),
    thirdParty: z.array(z.string()).optional(),
  }),
  assumptions: z.array(z.string()),
  dependencies: z.array(z.string()).optional(),
  risks: z.array(z.object({
    risk: z.string(),
    mitigation: z.string(),
  })).optional(),
});

export const ProjectEstimateSchema = z.object({
  totalCost: z.number().min(0),
  totalDays: z.number().min(1),
  totalHours: z.number().min(1),
  breakdown: z.array(z.object({
    deliverableId: z.string(),
    deliverableName: z.string(),
    hours: z.number(),
    cost: z.number(),
    days: z.number(),
    confidence: z.number().min(0).max(1),
  })),
  timeline: z.array(z.object({
    phase: z.string(),
    startDay: z.number(),
    endDay: z.number(),
    deliverables: z.array(z.string()),
  })),
  costBreakdown: z.object({
    labor: z.number(),
    thirdPartyServices: z.number().optional(),
    contingency: z.number(),
  }),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    notes: z.array(z.string()),
  }),
});

export const ProposalDocumentSchema = z.object({
  proposalId: z.string().optional(),
  version: z.number(),
  title: z.string(),
  executiveSummary: z.string().min(50),
  clientGoals: z.array(z.string()),
  targetOutcome: z.string(),
  deliverables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    features: z.array(z.string()),
    timeline: z.string(),
  })),
  investment: z.object({
    totalCost: z.number(),
    breakdown: z.array(z.object({
      item: z.string(),
      cost: z.number(),
    })),
    paymentTerms: z.string(),
  }),
  timeline: z.object({
    totalDays: z.number(),
    milestones: z.array(z.object({
      name: z.string(),
      day: z.number(),
      deliverables: z.array(z.string()),
    })),
  }),
  nextSteps: z.array(z.string()),
  terms: z.array(z.string()).optional(),
});

// ============================================
// ORCHESTRATOR TYPES
// ============================================

/**
 * Input state for Orchestrator Agent
 */
export interface OrchestratorInput {
  projectId: string;
  userId: string;
  proposal: ProposalDocument;
  scope: ProjectScope;
  estimate: ProjectEstimate;
}

/**
 * Output from Orchestrator Agent
 */
export interface ExecutionPlan {
  projectId: string;
  phases: ProjectPhase[];
  tasks: TaskDefinition[];
  summary: {
    totalTasks: number;
    tasksByPhase: Record<string, number>;
    tasksByAgent: Record<string, number>;
    criticalPath: string[]; // Task IDs on critical path
  };
}

export interface ProjectPhase {
  name: string;
  order: number;
  description: string;
  estimatedDays: number;
  taskIds: string[]; // References to tasks in this phase
}

export interface TaskDefinition {
  id: string; // Temporary ID for dependency mapping
  title: string;
  description: string;
  phase: 'design' | 'build' | 'test' | 'launch';
  agentName: 'design' | 'frontend' | 'backend' | 'content' | 'infrastructure' | 'qa' | 'human';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  deliverableId?: string; // Links to proposal deliverable
  featureIds?: string[]; // Links to specific features
  dependsOn: string[]; // Task IDs this depends on
  requiresHumanReview: boolean;
  acceptanceCriteria: string[];
  technicalContext?: {
    techStack?: string[];
    integrations?: string[];
    designRequirements?: string[];
    contentRequirements?: string[];
  };
}

export const ExecutionPlanSchema = z.object({
  projectId: z.string(),
  phases: z.array(z.object({
    name: z.string(),
    order: z.number(),
    description: z.string(),
    estimatedDays: z.number(),
    taskIds: z.array(z.string()),
  })),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    phase: z.enum(['design', 'build', 'test', 'launch']),
    agentName: z.enum(['design', 'frontend', 'backend', 'content', 'infrastructure', 'qa', 'human']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedHours: z.number(),
    deliverableId: z.string().optional(),
    featureIds: z.array(z.string()).optional(),
    dependsOn: z.array(z.string()),
    requiresHumanReview: z.boolean(),
    acceptanceCriteria: z.array(z.string()),
    technicalContext: z.object({
      techStack: z.array(z.string()).optional(),
      integrations: z.array(z.string()).optional(),
      designRequirements: z.array(z.string()).optional(),
      contentRequirements: z.array(z.string()).optional(),
    }).optional(),
  })),
  summary: z.object({
    totalTasks: z.number(),
    tasksByPhase: z.record(z.string(), z.number()),
    tasksByAgent: z.record(z.string(), z.number()),
    criticalPath: z.array(z.string()),
  }),
});

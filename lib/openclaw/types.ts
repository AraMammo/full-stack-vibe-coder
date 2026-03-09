/**
 * OpenClaw Types
 *
 * Shared types for the agentic evaluation/refinement framework.
 * OpenClaw is an agent pattern — instantiate with a skill, get a specialist evaluator.
 */

export type SkillId = 'structure' | 'brand_visual' | 'copy_conversion' | 'code_quality';

export interface SkillConfig {
  id: SkillId;
  name: string;
  systemPrompt: string;
  /** Keys from orchestrator executionResults this skill needs as context */
  contextKeys: string[];
}

export interface Finding {
  severity: 'critical' | 'major' | 'minor';
  file: string;
  issue: string;
  suggestion: string;
}

export interface EvaluationResult {
  skill: SkillId;
  findings: Finding[];
  score?: number;
  rawOutput: string;
  tokensUsed: number;
  executionTimeMs: number;
}

export interface SynthesizedAction {
  file: string;
  priority: number;
  actions: string[];
  sourceSkills: SkillId[];
}

export interface RefinementContext {
  projectId: string;
  files: Map<string, string>;
  /** Orchestrator prompt outputs keyed by promptId (e.g. 'sk_brand_identity_03') */
  orchestratorOutputs: Record<string, string>;
}

export type RefinementProgressCallback = (update: {
  cycle: number;
  totalCycles: number;
  phase: 'evaluating' | 'synthesizing' | 'regenerating' | 'complete';
  skill?: SkillId;
}) => void;

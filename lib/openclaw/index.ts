/**
 * OpenClaw — Agentic Evaluation & Refinement Framework
 *
 * OpenClaw is an agent pattern. Instantiate with a skill, get a specialist evaluator.
 * The refinement pipeline runs 4 agents in parallel across 3 fixed cycles to polish
 * generated codebases before deployment.
 *
 * Usage:
 *   import { runRefinementPipeline } from '@/lib/openclaw';
 *
 *   const refinedFiles = await runRefinementPipeline(
 *     projectId,
 *     codegenFiles,
 *     orchestratorOutputs,
 *     (update) => console.log(`Cycle ${update.cycle}: ${update.phase}`)
 *   );
 */

export { runRefinementPipeline, runSingleCycle } from './refinement-runner';
export { evaluate } from './agent';
export { synthesize } from './synthesizer';
export { regenerate } from './regenerator';
export { ALL_SKILLS, getSkill } from './skills';
export type {
  SkillId,
  SkillConfig,
  Finding,
  EvaluationResult,
  SynthesizedAction,
  RefinementContext,
  RefinementProgressCallback,
} from './types';

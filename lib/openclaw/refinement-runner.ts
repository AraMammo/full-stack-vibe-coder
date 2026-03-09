/**
 * OpenClaw Refinement Runner
 *
 * Orchestrates the 3-cycle refinement loop:
 *   Cycle N: evaluate (4 agents in parallel) → synthesize → regenerate
 *
 * This is the main entry point for the OpenClaw framework.
 */

import { PrismaClient } from '@/app/generated/prisma';
import { evaluate } from './agent';
import { synthesize } from './synthesizer';
import { regenerate } from './regenerator';
import { ALL_SKILLS } from './skills';
import {
  EvaluationResult,
  SynthesizedAction,
  RefinementProgressCallback,
} from './types';

const TOTAL_CYCLES = 3;

const prisma = new PrismaClient();

/**
 * Run the full OpenClaw refinement pipeline.
 *
 * Takes a file map and orchestrator context, runs 3 evaluation/refinement cycles,
 * and returns the improved file map. If refinement fails, returns the original files.
 *
 * @param projectId - Project ID for DB tracking
 * @param files - Current file map (filepath → content)
 * @param orchestratorOutputs - Prompt outputs keyed by promptId
 * @param onProgress - Optional progress callback
 * @returns Refined file map
 */
export async function runRefinementPipeline(
  projectId: string,
  files: Map<string, string>,
  orchestratorOutputs: Record<string, string>,
  onProgress?: RefinementProgressCallback,
): Promise<Map<string, string>> {
  console.log(`\n[OpenClaw] Starting refinement pipeline for project ${projectId}`);
  console.log(`[OpenClaw] Input: ${files.size} files, ${TOTAL_CYCLES} cycles, ${ALL_SKILLS.length} agents`);

  let currentFiles = new Map(files);

  for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
    const cycleStart = Date.now();
    console.log(`\n[OpenClaw] === Cycle ${cycle}/${TOTAL_CYCLES} ===`);

    try {
      // Phase 1: Evaluate in parallel (all 4 agents)
      onProgress?.({ cycle, totalCycles: TOTAL_CYCLES, phase: 'evaluating' });

      const evaluations = await Promise.all(
        ALL_SKILLS.map((skill) => evaluate(skill, currentFiles, orchestratorOutputs)),
      );

      // Phase 2: Synthesize findings into prioritized actions
      onProgress?.({ cycle, totalCycles: TOTAL_CYCLES, phase: 'synthesizing' });

      const actions = await synthesize(evaluations);

      // Phase 3: Regenerate affected files
      if (actions.length > 0) {
        onProgress?.({ cycle, totalCycles: TOTAL_CYCLES, phase: 'regenerating' });
        currentFiles = await regenerate(currentFiles, actions, orchestratorOutputs);
      } else {
        console.log(`[OpenClaw] Cycle ${cycle}: No actions needed — files are clean`);
      }

      // Persist cycle to DB
      await saveCycleRecord(projectId, cycle, evaluations, actions, Date.now() - cycleStart);

      onProgress?.({ cycle, totalCycles: TOTAL_CYCLES, phase: 'complete' });

      console.log(`[OpenClaw] Cycle ${cycle} complete in ${((Date.now() - cycleStart) / 1000).toFixed(1)}s`);

      // If no actions were needed, remaining cycles won't find anything new — still run them
      // per the "always 3 cycles" requirement, but they'll be fast no-ops
    } catch (cycleError) {
      console.error(`[OpenClaw] Cycle ${cycle} failed:`, cycleError);
      // Continue with current files — don't let a failed cycle block the pipeline
      await saveCycleError(projectId, cycle, cycleError);
    }
  }

  console.log(`[OpenClaw] Refinement complete. Output: ${currentFiles.size} files`);
  return currentFiles;
}

/**
 * Run a single refinement cycle (for post-deploy manual refinement).
 */
export async function runSingleCycle(
  projectId: string,
  files: Map<string, string>,
  orchestratorOutputs: Record<string, string>,
  onProgress?: RefinementProgressCallback,
): Promise<{ files: Map<string, string>; actions: SynthesizedAction[] }> {
  // Find the next cycle number for this project
  const lastCycle = await prisma.refinementCycle.findFirst({
    where: { projectId },
    orderBy: { cycleNumber: 'desc' },
    select: { cycleNumber: true },
  });
  const cycleNumber = (lastCycle?.cycleNumber || 0) + 1;

  console.log(`[OpenClaw] Running single refinement cycle ${cycleNumber} for project ${projectId}`);
  const cycleStart = Date.now();

  onProgress?.({ cycle: cycleNumber, totalCycles: cycleNumber, phase: 'evaluating' });
  const evaluations = await Promise.all(
    ALL_SKILLS.map((skill) => evaluate(skill, files, orchestratorOutputs)),
  );

  onProgress?.({ cycle: cycleNumber, totalCycles: cycleNumber, phase: 'synthesizing' });
  const actions = await synthesize(evaluations);

  let resultFiles = files;
  if (actions.length > 0) {
    onProgress?.({ cycle: cycleNumber, totalCycles: cycleNumber, phase: 'regenerating' });
    resultFiles = await regenerate(files, actions, orchestratorOutputs);
  }

  await saveCycleRecord(projectId, cycleNumber, evaluations, actions, Date.now() - cycleStart);
  onProgress?.({ cycle: cycleNumber, totalCycles: cycleNumber, phase: 'complete' });

  return { files: resultFiles, actions };
}

/**
 * Persist a completed cycle record to the database.
 */
async function saveCycleRecord(
  projectId: string,
  cycleNumber: number,
  evaluations: EvaluationResult[],
  actions: SynthesizedAction[],
  executionTimeMs: number,
): Promise<void> {
  try {
    const totalTokens = evaluations.reduce((sum, e) => sum + e.tokensUsed, 0);

    await prisma.refinementCycle.create({
      data: {
        projectId,
        cycleNumber,
        status: 'COMPLETE',
        synthesizedFeedback: JSON.stringify(actions),
        filesRegenerated: actions.map((a) => a.file),
        tokensUsed: totalTokens,
        executionTimeMs,
        completedAt: new Date(),
        evaluations: {
          create: evaluations.map((e) => ({
            skill: e.skill,
            findings: JSON.parse(JSON.stringify(e.findings)),
            score: e.score,
            rawOutput: e.rawOutput,
            tokensUsed: e.tokensUsed,
            executionTimeMs: e.executionTimeMs,
          })),
        },
      },
    });
  } catch (error) {
    console.warn(`[OpenClaw] Failed to persist cycle ${cycleNumber} record:`, error);
  }
}

/**
 * Persist a failed cycle record.
 */
async function saveCycleError(
  projectId: string,
  cycleNumber: number,
  error: unknown,
): Promise<void> {
  try {
    await prisma.refinementCycle.create({
      data: {
        projectId,
        cycleNumber,
        status: 'FAILED',
        synthesizedFeedback: `Error: ${error instanceof Error ? error.message : String(error)}`,
        filesRegenerated: [],
        tokensUsed: 0,
        executionTimeMs: 0,
      },
    });
  } catch (dbError) {
    console.warn(`[OpenClaw] Failed to persist cycle ${cycleNumber} error record:`, dbError);
  }
}

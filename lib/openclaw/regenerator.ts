/**
 * OpenClaw Regenerator
 *
 * Takes synthesized actions and regenerates only the affected files.
 * Each file is regenerated independently with its specific action list.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../ai-config';
import { SynthesizedAction } from './types';

const anthropic = new Anthropic();

const REGEN_SYSTEM_PROMPT = `You are a code regenerator. You will receive:
1. The current content of a file
2. A list of specific changes to make

Your job: apply ALL the requested changes and return the complete updated file.

Rules:
- Return ONLY the file content. No explanation, no markdown fences, no filepath headers.
- Apply every change in the list. Do not skip any.
- Do not change anything that wasn't requested. Preserve all other code exactly.
- If changes conflict, use your best judgment to reconcile.
- The output must be valid, working code that integrates with the rest of the codebase.`;

/**
 * Regenerate affected files based on synthesized actions.
 * Processes files in parallel (up to 5 concurrent).
 */
export async function regenerate(
  currentFiles: Map<string, string>,
  actions: SynthesizedAction[],
  orchestratorOutputs: Record<string, string>,
): Promise<Map<string, string>> {
  const updatedFiles = new Map(currentFiles);

  if (actions.length === 0) return updatedFiles;

  // Process in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < actions.length; i += BATCH_SIZE) {
    const batch = actions.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((action) => regenerateFile(currentFiles, action, orchestratorOutputs)),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const action = batch[j];
      if (result.status === 'fulfilled' && result.value) {
        updatedFiles.set(action.file, result.value);
      } else if (result.status === 'rejected') {
        console.warn(`[OpenClaw:Regen] Failed to regenerate ${action.file}:`, result.reason);
      }
    }
  }

  const changedCount = actions.filter((a) => updatedFiles.get(a.file) !== currentFiles.get(a.file)).length;
  console.log(`[OpenClaw:Regen] ${changedCount}/${actions.length} files updated`);

  return updatedFiles;
}

/**
 * Regenerate a single file with its action list.
 */
async function regenerateFile(
  currentFiles: Map<string, string>,
  action: SynthesizedAction,
  orchestratorOutputs: Record<string, string>,
): Promise<string | null> {
  const currentContent = currentFiles.get(action.file);

  if (!currentContent) {
    // File doesn't exist yet — generate it fresh
    return generateNewFile(action, orchestratorOutputs);
  }

  const userMessage = `CURRENT FILE: ${action.file}
\`\`\`
${currentContent}
\`\`\`

CHANGES TO APPLY:
${action.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Return the complete updated file content.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: REGEN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const output = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Strip markdown fences if Claude wrapped the output
    let cleaned = output.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return cleaned;
  } catch (error) {
    console.error(`[OpenClaw:Regen] Error regenerating ${action.file}:`, error);
    return null;
  }
}

/**
 * Generate a new file that doesn't exist yet.
 */
async function generateNewFile(
  action: SynthesizedAction,
  orchestratorOutputs: Record<string, string>,
): Promise<string | null> {
  const contextSnippet = Object.entries(orchestratorOutputs)
    .map(([key, val]) => `${key}: ${val.substring(0, 500)}...`)
    .join('\n\n');

  const userMessage = `Generate a new file: ${action.file}

PROJECT CONTEXT (abbreviated):
${contextSnippet}

REQUIREMENTS:
${action.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Return ONLY the file content. No explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: REGEN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const output = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let cleaned = output.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return cleaned;
  } catch (error) {
    console.error(`[OpenClaw:Regen] Error generating new file ${action.file}:`, error);
    return null;
  }
}

/**
 * OpenClaw Agent
 *
 * Generic agent class that takes a SkillConfig and evaluates a file map.
 * Each instance is a specialist — structure, brand, copy, or code quality.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../ai-config';
import { SkillConfig, Finding, EvaluationResult } from './types';

const anthropic = new Anthropic();

/**
 * Format a file map into a string representation for Claude.
 * Truncates very large files to keep within token limits.
 */
function formatFileMap(files: Map<string, string>): string {
  const parts: string[] = [];
  for (const [filepath, content] of Array.from(files.entries())) {
    // Truncate files over 500 lines to keep context manageable
    const lines = content.split('\n');
    const truncated = lines.length > 500
      ? lines.slice(0, 500).join('\n') + `\n\n... [truncated — ${lines.length - 500} more lines]`
      : content;
    parts.push(`--- FILE: ${filepath} ---\n${truncated}\n--- END FILE ---`);
  }
  return parts.join('\n\n');
}

/**
 * Parse Claude's response into structured findings.
 * Handles both clean JSON and JSON wrapped in markdown fences.
 */
function parseFindings(raw: string): Finding[] {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((f: Record<string, unknown>) => f.severity && f.file && f.issue && f.suggestion)
      .map((f: Record<string, unknown>) => ({
        severity: f.severity as Finding['severity'],
        file: String(f.file),
        issue: String(f.issue),
        suggestion: String(f.suggestion),
      }));
  } catch {
    console.warn(`[OpenClaw] Failed to parse findings JSON, returning empty array`);
    return [];
  }
}

/**
 * Run a single skill evaluation against a file map.
 */
export async function evaluate(
  skill: SkillConfig,
  files: Map<string, string>,
  orchestratorOutputs: Record<string, string>,
): Promise<EvaluationResult> {
  const startTime = Date.now();

  // Build context from orchestrator outputs this skill needs
  const contextParts: string[] = [];
  for (const key of skill.contextKeys) {
    const output = orchestratorOutputs[key];
    if (output) {
      contextParts.push(`--- CONTEXT: ${key} ---\n${output}\n--- END CONTEXT ---`);
    }
  }

  const userMessage = [
    contextParts.length > 0 ? contextParts.join('\n\n') : null,
    'FILE MAP:',
    formatFileMap(files),
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: skill.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawOutput = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const findings = parseFindings(rawOutput);
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    console.log(
      `[OpenClaw:${skill.id}] ${findings.length} findings (${findings.filter((f) => f.severity === 'critical').length} critical, ${findings.filter((f) => f.severity === 'major').length} major, ${findings.filter((f) => f.severity === 'minor').length} minor) — ${tokensUsed} tokens — ${Date.now() - startTime}ms`,
    );

    return {
      skill: skill.id,
      findings,
      rawOutput,
      tokensUsed,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[OpenClaw:${skill.id}] Evaluation failed:`, error);
    return {
      skill: skill.id,
      findings: [],
      rawOutput: `Error: ${error instanceof Error ? error.message : String(error)}`,
      tokensUsed: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

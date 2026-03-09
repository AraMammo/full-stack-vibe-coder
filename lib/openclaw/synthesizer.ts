/**
 * OpenClaw Synthesizer
 *
 * Merges parallel agent evaluations into a prioritized list of actions per file.
 * Uses Claude to intelligently merge overlapping/conflicting findings.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../ai-config';
import { EvaluationResult, SynthesizedAction } from './types';

const anthropic = new Anthropic();

const SYNTHESIS_PROMPT = `You are a technical project manager synthesizing feedback from 4 specialist reviewers into a single prioritized action list.

You will receive findings from these reviewers:
- Structure Agent: page hierarchy, routing, responsive layout
- Brand/Visual Agent: color, typography, visual identity
- Copy/Conversion Agent: sales copy, CTAs, value propositions
- Code Quality Agent: TypeScript, accessibility, performance

Your job:
1. Group findings by file
2. Merge overlapping findings (e.g., two agents flagging the same section)
3. Resolve conflicts (if Brand says "use pink" and Copy says "use blue", prefer Brand for color decisions)
4. Prioritize: critical > major > minor, and cross-agent agreement increases priority
5. For each file, produce a single clear list of actions

Return a JSON array of objects:
{
  "file": "path/to/file",
  "priority": 1-10 (1 = highest, most urgent),
  "actions": ["specific action 1", "specific action 2"],
  "sourceSkills": ["structure", "brand_visual"]
}

Rules:
- Only include files that need changes. If a file has no findings, omit it.
- Merge duplicate findings into one action, don't list the same fix twice.
- Actions should be specific enough for a code generator to execute without ambiguity.
- Maximum 20 files per synthesis (focus on highest-impact changes).
- Return ONLY the JSON array. No explanation, no markdown fences.`;

/**
 * Synthesize multiple agent evaluations into prioritized file-level actions.
 */
export async function synthesize(evaluations: EvaluationResult[]): Promise<SynthesizedAction[]> {
  // If no findings across all agents, skip the synthesis call
  const totalFindings = evaluations.reduce((sum, e) => sum + e.findings.length, 0);
  if (totalFindings === 0) {
    console.log('[OpenClaw:Synthesizer] No findings to synthesize');
    return [];
  }

  // Format findings by agent for Claude
  const findingsSummary = evaluations
    .map((e) => {
      if (e.findings.length === 0) return null;
      const items = e.findings
        .map((f) => `  [${f.severity}] ${f.file}: ${f.issue} → ${f.suggestion}`)
        .join('\n');
      return `### ${e.skill} (${e.findings.length} findings)\n${items}`;
    })
    .filter(Boolean)
    .join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYNTHESIS_PROMPT,
      messages: [{ role: 'user', content: findingsSummary }],
    });

    const rawOutput = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let cleaned = rawOutput.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    const actions: SynthesizedAction[] = parsed
      .filter((a: Record<string, unknown>) => a.file && Array.isArray(a.actions) && (a.actions as string[]).length > 0)
      .map((a: Record<string, unknown>) => ({
        file: String(a.file),
        priority: typeof a.priority === 'number' ? a.priority : 5,
        actions: (a.actions as string[]).map(String),
        sourceSkills: Array.isArray(a.sourceSkills) ? (a.sourceSkills as string[]).map(String) as SynthesizedAction['sourceSkills'] : [],
      }))
      .sort((a: SynthesizedAction, b: SynthesizedAction) => a.priority - b.priority);

    console.log(`[OpenClaw:Synthesizer] ${actions.length} files need changes (${totalFindings} findings merged)`);
    return actions;
  } catch (error) {
    console.error('[OpenClaw:Synthesizer] Synthesis failed:', error);
    return [];
  }
}

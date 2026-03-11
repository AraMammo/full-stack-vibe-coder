/**
 * Industry Classifier
 *
 * Takes a user's business description and classifies it into a known
 * industry vertical. Returns the template slug if a match exists.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai-config";
import { listTemplates } from "@/lib/templates/registry";

export interface ClassificationResult {
  industry: string; // e.g., "coaching", "home_services"
  confidence: "high" | "medium" | "low";
  templateSlug: string | null; // null if no matching template
  reasoning: string;
}

const anthropic = new Anthropic();

export async function classifyIndustry(
  userMessage: string
): Promise<ClassificationResult> {
  const templates = listTemplates();
  const availableTemplates = templates
    .map((t) => `- "${t.slug}": ${t.name} — ${t.description}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    system: `You are an industry classifier for a website builder platform. Given a user's description of their business, classify it into an industry vertical.

Available templates:
${availableTemplates}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "industry": "<industry_key>",
  "confidence": "high" | "medium" | "low",
  "templateSlug": "<matching template slug or null>",
  "reasoning": "<one sentence>"
}

Rules:
- If the business clearly matches a template, set templateSlug to that slug and confidence to "high"
- If it's a close match (e.g., "life coach" matches "coaching"), still set the slug and "high"
- If it's adjacent but not exact (e.g., "therapist" could use coaching template), set "medium"
- If no template fits, set templateSlug to null
- The industry field should be a snake_case key like "coaching", "home_services", "fitness"`,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text);
    return {
      industry: result.industry || "unknown",
      confidence: result.confidence || "low",
      templateSlug: result.templateSlug || null,
      reasoning: result.reasoning || "",
    };
  } catch {
    return {
      industry: "unknown",
      confidence: "low",
      templateSlug: null,
      reasoning: "Failed to parse classification response",
    };
  }
}

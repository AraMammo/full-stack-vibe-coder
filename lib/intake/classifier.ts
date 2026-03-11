/**
 * Industry Classifier
 *
 * Takes a user's business description and classifies it into one of
 * 28 industry verticals. Returns the industry slug so downstream
 * systems can load the right context for code generation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai-config";
import { getIndustryList } from "@/lib/industry/context-loader";

export interface ClassificationResult {
  industry: string; // e.g., "real_estate", "home_services"
  confidence: "high" | "medium" | "low";
  templateSlug: string | null; // backward compat — same as industry
  reasoning: string;
}

const anthropic = new Anthropic();

export async function classifyIndustry(
  userMessage: string
): Promise<ClassificationResult> {
  const industryList = getIndustryList();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    system: `You are an industry classifier for a software builder platform. Given a user's description of their business, classify it into the closest industry vertical.

Available industry verticals:
${industryList}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "industry": "<industry_slug>",
  "confidence": "high" | "medium" | "low",
  "reasoning": "<one sentence explaining your choice>"
}

Rules:
- Pick the CLOSEST match even if it's not exact. A "dog walking app" → "pet_services". A "life coach" → "consultant_coach".
- Use "high" confidence when the match is obvious.
- Use "medium" when the business could fit multiple categories — pick the best one.
- Use "low" only when the business is truly unlike anything listed. Still pick the closest match.
- If a business is a SaaS TOOL for a specific industry (e.g., "CRM for real estate agents"), classify by the TOOL type (saas_startup or agency_saas), not the industry it serves.
- The industry slug must be one of the listed slugs exactly.`,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text);
    const industry = result.industry || "consultant_coach";
    return {
      industry,
      confidence: result.confidence || "low",
      templateSlug: industry, // backward compat
      reasoning: result.reasoning || "",
    };
  } catch {
    return {
      industry: "consultant_coach",
      confidence: "low",
      templateSlug: "consultant_coach",
      reasoning: "Failed to parse classification response",
    };
  }
}

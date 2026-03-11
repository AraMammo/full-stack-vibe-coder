/**
 * Profile Extractor
 *
 * Drives a multi-turn conversation to extract a structured IndustryProfile.
 * Uses the classified industry context to ask the RIGHT questions for each
 * business type — a realtor gets asked about service areas and listing types,
 * a plumber gets asked about dispatch and service types.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai-config";
import { IndustryProfile } from "@/lib/templates/types";
import { getIndustryContext, getIndustryName } from "@/lib/industry/context-loader";

const anthropic = new Anthropic();

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ExtractionResult {
  complete: boolean;
  profile: Partial<IndustryProfile> | null;
  nextQuestion: string;
  fieldsCollected: string[];
  fieldsMissing: string[];
}

function buildSystemPrompt(industrySlug: string | null): string {
  const industryContext = industrySlug ? getIndustryContext(industrySlug) : null;
  const industryName = industrySlug ? getIndustryName(industrySlug) : null;

  let industrySection = '';
  if (industryContext && industryName) {
    industrySection = `

INDUSTRY CONTEXT — ${industryName}:
This user is building a ${industryName} business. Here is research on what this type of business needs:

${industryContext}

Use this context to ask RELEVANT questions for this industry. Do NOT ask about features that don't apply.
For example:
- A plumber needs service areas, emergency availability, and job types — NOT session packages
- A restaurant needs menu categories, seating capacity, and reservation policy — NOT hourly rates
- A real estate agent needs service areas, listing specialties, and lead capture — NOT cancellation policies

Extract whatever fields are relevant to THIS industry into the industryData object.`;
  }

  return `You are a friendly intake assistant for a website builder. Your job is to have a natural conversation to gather information about a user's business so we can build their website.

REQUIRED FIELDS (collect for every business):
- businessName: Their business/practice name
- ownerName: The owner's name
- tagline: A short tagline or value proposition
- about: Brief description of who they are and what they do (2-3 sentences)

NICE TO HAVE (use sensible defaults if not provided):
- primaryColor and accentColor (hex colors — pick based on industry if not stated)
- timezone (guess from context clues, default America/New_York)
- phone number

INDUSTRY-SPECIFIC FIELDS:
Based on the business type, collect whatever is relevant. Examples:
- Service businesses: what services they offer, pricing, availability
- Product businesses: what they sell, pricing model, delivery method
- SaaS: target user, key features, pricing tiers
- Local services: service area, availability, emergency rates
Put all industry-specific fields in the "industryData" object.
${industrySection}

CONVERSATION RULES:
1. Ask 1-2 questions per turn, never more
2. Be warm and conversational, not robotic
3. Acknowledge what they've shared before asking more
4. After 3-4 turns, you should have enough to proceed
5. When you have enough info, set complete to true

RESPONSE FORMAT — respond with ONLY valid JSON (no markdown, no code fences):
{
  "complete": false,
  "message": "Your conversational response to the user",
  "extractedSoFar": {
    "businessName": "...",
    "ownerName": "...",
    "tagline": "...",
    "about": "...",
    "primaryColor": "#hex",
    "accentColor": "#hex",
    "timezone": "America/New_York",
    "industrySlug": "${industrySlug || ''}",
    "industryData": {
      // whatever fields are relevant to this business type
    }
  },
  "fieldsCollected": ["businessName", "ownerName"],
  "fieldsMissing": ["tagline", "industryData"]
}

When complete is true, extractedSoFar must contain all required fields filled in.
Pick sensible brand colors based on the industry if the user doesn't specify.`;
}

export async function extractProfile(
  conversationHistory: ConversationTurn[],
  industrySlug: string | null
): Promise<ExtractionResult> {
  const systemPrompt = buildSystemPrompt(industrySlug);

  const messages: Anthropic.MessageParam[] = conversationHistory.map(
    (turn) => ({
      role: turn.role,
      content: turn.content,
    })
  );

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text);

    let profile: Partial<IndustryProfile> | null = null;
    if (result.complete && result.extractedSoFar) {
      profile = normalizeProfile(result.extractedSoFar);
    }

    return {
      complete: result.complete || false,
      profile,
      nextQuestion: result.message || "",
      fieldsCollected: result.fieldsCollected || [],
      fieldsMissing: result.fieldsMissing || [],
    };
  } catch {
    return {
      complete: false,
      profile: null,
      nextQuestion:
        "I'd love to help you build your website! Tell me about your business — what's your business name and what do you do?",
      fieldsCollected: [],
      fieldsMissing: ["businessName"],
    };
  }
}

/**
 * Normalize a profile from Claude's extraction.
 * Only validates universal fields — industryData passes through as-is.
 */
function normalizeProfile(
  raw: Record<string, unknown>
): IndustryProfile {
  return {
    businessName: String(raw.businessName || "My Business"),
    ownerName: String(raw.ownerName || "Owner"),
    ownerEmail: String(raw.ownerEmail || ""),
    tagline: raw.tagline ? String(raw.tagline) : undefined,
    about: raw.about ? String(raw.about) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    primaryColor: String(raw.primaryColor || "#2563eb"),
    accentColor: String(raw.accentColor || "#f59e0b"),
    timezone: String(raw.timezone || "America/New_York"),
    industrySlug: raw.industrySlug ? String(raw.industrySlug) : undefined,
    industryData: (raw.industryData && typeof raw.industryData === "object")
      ? raw.industryData as Record<string, unknown>
      : undefined,
    // Legacy fields — populate if present in extraction (backward compat)
    services: Array.isArray(raw.services) ? raw.services.map((s: Record<string, unknown>) => ({
      name: String(s.name || "Service"),
      description: String(s.description || ""),
      duration: Number(s.duration) || 60,
      price: Number(s.price) || 10000,
      type: String(s.type || "INDIVIDUAL"),
    })) : undefined,
    packages: Array.isArray(raw.packages) ? raw.packages.map((p: Record<string, unknown>) => ({
      name: String(p.name || "Package"),
      description: String(p.description || ""),
      price: Number(p.price) || 50000,
      totalSessions: Number(p.totalSessions) || 4,
      validityDays: Number(p.validityDays) || 90,
      serviceNames: Array.isArray(p.serviceNames) ? p.serviceNames.map(String) : [],
    })) : undefined,
    businessHours: raw.businessHours && typeof raw.businessHours === "object"
      ? {
          startTime: String((raw.businessHours as Record<string, unknown>).startTime || "09:00"),
          endTime: String((raw.businessHours as Record<string, unknown>).endTime || "17:00"),
          daysOfWeek: Array.isArray((raw.businessHours as Record<string, unknown>).daysOfWeek)
            ? (raw.businessHours as Record<string, unknown>).daysOfWeek as number[]
            : [1, 2, 3, 4, 5],
        }
      : undefined,
    credentials: Array.isArray(raw.credentials) ? raw.credentials.map(String) : undefined,
    socialLinks: raw.socialLinks && typeof raw.socialLinks === "object"
      ? raw.socialLinks as Record<string, string>
      : undefined,
    cancellationPolicyHours: raw.cancellationPolicyHours
      ? Number(raw.cancellationPolicyHours)
      : undefined,
  };
}

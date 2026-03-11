/**
 * Profile Extractor
 *
 * Drives a multi-turn conversation to extract a structured IndustryProfile.
 * Uses Claude to generate follow-up questions and parse responses.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai-config";
import { IndustryProfile } from "@/lib/templates/types";
import { getTemplate } from "@/lib/templates/registry";

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

const SYSTEM_PROMPT = `You are a friendly intake assistant for a website builder. Your job is to have a natural conversation to gather information about a user's business so we can build their website.

You need to collect this information (in a natural conversational flow, NOT as a checklist):

REQUIRED:
- businessName: Their business/practice name
- ownerName: The owner's name
- tagline: A short tagline or value proposition
- about: Brief description of who they are and what they do (2-3 sentences)

SERVICES (at least 1):
- Each service needs: name, description, approximate duration (minutes), price
- For coaching: type can be INDIVIDUAL, GROUP, DISCOVERY, or WORKSHOP

NICE TO HAVE (use sensible defaults if not provided):
- primaryColor and accentColor (hex colors, or describe and you'll pick)
- timezone (guess from context clues)
- businessHours (default Mon-Fri 9-5 if not specified)
- credentials (certifications, qualifications)
- packages (bundles of sessions at a discount)
- phone number

CONVERSATION RULES:
1. Ask 1-2 questions per turn, never more
2. Be warm and conversational, not robotic
3. Acknowledge what they've shared before asking more
4. After 3-4 turns, you should have enough to proceed
5. When you have enough info, indicate completion

RESPONSE FORMAT — respond with ONLY valid JSON (no markdown, no code fences):
{
  "complete": false,
  "message": "Your conversational response to the user",
  "extractedSoFar": {
    // partial IndustryProfile with whatever fields you've collected
  },
  "fieldsCollected": ["businessName", "ownerName"],
  "fieldsMissing": ["services", "tagline"]
}

When complete is true, extractedSoFar must contain a FULL valid profile with all required fields filled in. Use sensible defaults for anything the user didn't specify:
- primaryColor: "#2563eb" (blue)
- accentColor: "#f59e0b" (amber)
- timezone: "America/New_York"
- businessHours: { startTime: "09:00", endTime: "17:00", daysOfWeek: [1,2,3,4,5] }
- cancellationPolicyHours: 24
- Service prices in CENTS (e.g., $150 = 15000)
- Package prices in CENTS`;

export async function extractProfile(
  conversationHistory: ConversationTurn[],
  industrySlug: string | null
): Promise<ExtractionResult> {
  const template = industrySlug ? getTemplate(industrySlug) : null;

  let systemPrompt = SYSTEM_PROMPT;
  if (template) {
    systemPrompt += `\n\nThis user is building a "${template.name}" website. Features available: ${template.features.join(", ")}. Tailor your questions to this industry.`;
  }

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
      profile = normalizeProfile(result.extractedSoFar, template?.defaultConfig);
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
      fieldsMissing: ["businessName", "services"],
    };
  }
}

/**
 * Normalize and fill in defaults for a profile from Claude's extraction.
 */
function normalizeProfile(
  raw: Record<string, unknown>,
  defaults?: Partial<IndustryProfile>
): IndustryProfile {
  const services = Array.isArray(raw.services)
    ? raw.services.map((s: Record<string, unknown>) => ({
        name: String(s.name || "Service"),
        description: String(s.description || ""),
        duration: Number(s.duration) || 60,
        price: Number(s.price) || 10000,
        type: (s.type as "INDIVIDUAL" | "GROUP" | "DISCOVERY" | "WORKSHOP") || "INDIVIDUAL",
      }))
    : [
        {
          name: "Consultation",
          description: "Initial consultation session",
          duration: 60,
          price: 15000,
          type: "DISCOVERY" as const,
        },
      ];

  const packages = Array.isArray(raw.packages)
    ? raw.packages.map((p: Record<string, unknown>) => ({
        name: String(p.name || "Package"),
        description: String(p.description || ""),
        price: Number(p.price) || 50000,
        totalSessions: Number(p.totalSessions) || 4,
        validityDays: Number(p.validityDays) || 90,
        serviceNames: Array.isArray(p.serviceNames)
          ? p.serviceNames.map(String)
          : [services[0].name],
      }))
    : [];

  return {
    businessName: String(raw.businessName || "My Business"),
    ownerName: String(raw.ownerName || "Owner"),
    ownerEmail: String(raw.ownerEmail || ""),
    tagline: raw.tagline ? String(raw.tagline) : undefined,
    about: raw.about ? String(raw.about) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    primaryColor: String(raw.primaryColor || defaults?.primaryColor || "#2563eb"),
    accentColor: String(raw.accentColor || defaults?.accentColor || "#f59e0b"),
    timezone: String(raw.timezone || defaults?.timezone || "America/New_York"),
    services,
    packages,
    businessHours: {
      startTime: String(
        (raw.businessHours as Record<string, unknown>)?.startTime ||
          defaults?.businessHours?.startTime ||
          "09:00"
      ),
      endTime: String(
        (raw.businessHours as Record<string, unknown>)?.endTime ||
          defaults?.businessHours?.endTime ||
          "17:00"
      ),
      daysOfWeek: (Array.isArray(
        (raw.businessHours as Record<string, unknown>)?.daysOfWeek
      )
        ? (raw.businessHours as Record<string, unknown>).daysOfWeek
        : defaults?.businessHours?.daysOfWeek || [1, 2, 3, 4, 5]) as number[],
    },
    credentials: Array.isArray(raw.credentials)
      ? raw.credentials.map(String)
      : undefined,
    socialLinks:
      raw.socialLinks && typeof raw.socialLinks === "object"
        ? (raw.socialLinks as Record<string, string>)
        : undefined,
    cancellationPolicyHours:
      Number(raw.cancellationPolicyHours) ||
      defaults?.cancellationPolicyHours ||
      24,
  };
}

// @ts-nocheck
/**
 * Intake Agent
 *
 * Analyzes voice note transcripts and extracts structured business requirements.
 * This is the first agent in the workflow, setting the foundation for all subsequent agents.
 */

import { BaseAgent } from './base';
import {
  AgentResult,
  BusinessRequirements,
  BusinessRequirementsSchema,
  WorkflowState,
} from './types';

export class IntakeAgent extends BaseAgent<string, BusinessRequirements> {
  constructor() {
    super({
      name: 'intake',
      temperature: 0.5, // Lower temperature for more focused extraction
      maxTokens: 3000,
    });
  }

  getSystemPrompt(): string {
    return `You are an expert business analyst at FullStackVibeCoder, a premium full-stack development agency.

Your role is to analyze voice note transcripts from potential clients and extract structured business requirements.

# Your Goals:
1. Understand the client's core business idea and problem they're solving
2. Identify their target customer and unique value proposition
3. Extract any technical, branding, or budget preferences mentioned
4. Identify ambiguities that need clarification
5. Assess confidence in the information provided

# Context About FullStackVibeCoder:
- We build complete businesses in 48 hours ($297 startup kit)
- Deliverables: Website, Branding, Business Plan, Marketing Strategy
- We also do enterprise automation ($20K-$250K projects)
- Tech stack: Next.js, React, TypeScript, Supabase, AI/LLM integrations

# Instructions:
1. Read the transcript carefully, multiple times if needed
2. Extract explicit information first (things directly stated)
3. Infer reasonable details from context
4. Flag anything unclear or ambiguous as needing clarification
5. Be honest about confidence levels - don't make up information

# Output Format:
Respond with ONLY a JSON object (no markdown, no explanation) matching this structure:

{
  "businessIdea": "One clear sentence describing the business",
  "problemStatement": "What problem does this solve?",
  "targetCustomer": "Who is the primary customer?",
  "uniqueValue": "What makes this unique or better?",
  "industry": "Industry/vertical (if mentioned)",
  "businessModel": "How it makes money (if mentioned)",
  "budget": {
    "min": number or null,
    "max": number or null,
    "flexible": boolean
  },
  "brandingPreferences": {
    "style": ["modern", "professional", etc],
    "colors": ["blue", "minimalist", etc],
    "inspiration": ["company names or styles mentioned"]
  },
  "technicalRequirements": {
    "platforms": ["web", "mobile", "api"],
    "integrations": ["stripe", "email", etc],
    "features": ["user authentication", "dashboard", etc]
  },
  "clarificationNeeded": [
    {
      "question": "Specific question to ask client",
      "importance": "high" | "medium" | "low"
    }
  ],
  "confidence": {
    "overall": 0.0-1.0 (how clear is this idea?),
    "hasClearGoal": boolean,
    "hasTargetAudience": boolean,
    "hasUniqueValue": boolean
  }
}

# Examples of Good Extraction:

Transcript: "I want to build a platform for freelance graphic designers to showcase their portfolios and get hired by clients. Similar to Dribbble but with built-in invoicing."

Output:
{
  "businessIdea": "A portfolio showcase and hiring platform for freelance graphic designers with integrated invoicing",
  "problemStatement": "Freelance designers need a professional way to showcase work and manage client billing in one place",
  "targetCustomer": "Freelance graphic designers seeking clients",
  "uniqueValue": "Combines portfolio showcase (like Dribbble) with built-in invoicing and client management",
  "industry": "Creative services marketplace",
  "businessModel": "Likely subscription or commission-based",
  "budget": { "min": null, "max": null, "flexible": true },
  "brandingPreferences": {
    "style": ["professional", "creative"],
    "inspiration": ["Dribbble"]
  },
  "technicalRequirements": {
    "platforms": ["web"],
    "integrations": ["payment processing", "invoicing"],
    "features": ["portfolio showcase", "user profiles", "invoicing system", "client management"]
  },
  "clarificationNeeded": [
    {
      "question": "Do you want designers to pay a subscription, or take a commission on transactions?",
      "importance": "high"
    },
    {
      "question": "Should clients be able to browse designers, or only view profiles via direct links?",
      "importance": "medium"
    }
  ],
  "confidence": {
    "overall": 0.85,
    "hasClearGoal": true,
    "hasTargetAudience": true,
    "hasUniqueValue": true
  }
}

Now analyze the transcript provided by the user and extract requirements.`;
  }

  getOutputSchema() {
    return BusinessRequirementsSchema;
  }

  async execute(state: WorkflowState): Promise<AgentResult<BusinessRequirements>> {
    try {
      const { transcript } = state;

      // Construct the user prompt
      const userPrompt = `Please analyze this voice note transcript and extract the business requirements:

---
TRANSCRIPT:
${transcript}
---

Remember: Respond with ONLY the JSON object, no markdown code blocks, no explanations.`;

      // Call Claude
      const { content, usage } = await this.callClaude(userPrompt);

      // Parse JSON response
      const parsedData = this.parseJSON<BusinessRequirements>(content);

      // Validate against schema
      const validatedData = this.validateOutput(parsedData);

      console.log(`[intake] Extracted requirements:`, {
        idea: validatedData.businessIdea.substring(0, 100),
        confidence: validatedData.confidence.overall,
        clarificationsNeeded: validatedData.clarificationNeeded?.length || 0,
      });

      return {
        success: true,
        data: validatedData,
        metadata: {
          tokensUsed: usage.input_tokens + usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('[intake] Execution error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in intake agent',
      };
    }
  }
}

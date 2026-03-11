/**
 * Business Analyze API
 *
 * POST /api/shipkit/analyze
 * Takes text (typed or transcribed voice) and returns a structured business analysis.
 * Uses Claude (Anthropic SDK). No auth required — rate-limited.
 * Saves to chat_submissions with sessionId for later reference.
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '@/lib/ai-config';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rate-limit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_TEXT_LENGTH = 5000;

const SYSTEM_PROMPT = `You are a business analyst for Full Stack Vibe Coder. Given a business idea, generate a structured analysis that serves as an interactive business brief.

Your response MUST be valid JSON with this exact structure:
{
  "businessNames": [
    { "name": "Primary Name", "tagline": "A catchy tagline" },
    { "name": "Alternative Name", "tagline": "Another tagline" },
    { "name": "Third Option", "tagline": "Yet another tagline" }
  ],
  "valueProposition": "A compelling 1-2 sentence value proposition",
  "targetAudience": [
    { "segment": "Segment Name", "description": "Brief description of this audience segment" },
    { "segment": "Segment Name 2", "description": "Brief description" }
  ],
  "competitivePositioning": "2-3 sentences on how this business differentiates from competitors",
  "sitePreviewHtml": "<div style='font-family: system-ui; max-width: 600px; margin: 0 auto;'><header style='padding: 20px; text-align: center; background: linear-gradient(135deg, PRIMARY_COLOR, SECONDARY_COLOR); color: white; border-radius: 12px 12px 0 0;'><h1 style='margin: 0; font-size: 24px;'>BUSINESS_NAME</h1><p style='margin: 8px 0 0; opacity: 0.9;'>TAGLINE</p></header><main style='padding: 20px; background: #f9fafb; border-radius: 0 0 12px 12px;'><h2 style='font-size: 18px; color: #111;'>VALUE_PROP_HEADLINE</h2><p style='color: #666; line-height: 1.6;'>BRIEF_DESCRIPTION</p></main></div>",
  "message": "An enthusiastic 2-3 sentence summary of what you just created, ending with an invitation to build the full app"
}

Guidelines:
- Business names should be creative, memorable, and available as .com domains (avoid generic words)
- Value proposition should clearly state the problem solved and for whom
- Target audience should have 2-3 specific segments
- Site preview HTML should be a self-contained styled snippet showing what their landing page hero could look like
- Use appropriate brand colors in the site preview (derive from the business concept)
- Keep the analysis grounded and actionable, not generic`;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = checkRateLimit(clientIP, rateLimiters.aiOperation);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await request.json();
    const { text, inputType = 'text' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Generate sessionId for this analysis
    const sessionId = crypto.randomUUID();

    // Call Claude
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this business idea and generate a structured business brief:\n\n${text}`,
        },
      ],
    });

    // Extract text content
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!responseText) {
      console.error('[Analyze] Empty response from Claude');
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      );
    }

    // Parse JSON response - handle possible markdown code fences
    let analysis: Record<string, unknown>;
    try {
      const jsonStr = responseText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Analyze] Failed to parse Claude response:', parseError);
      console.error('[Analyze] Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse analysis' },
        { status: 500 }
      );
    }

    // Log the analysis (chat_submissions table was removed — just log for now)
    console.log(`[Analyze] Generated analysis for sessionId: ${sessionId}`);

    return NextResponse.json({
      sessionId,
      analysis,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Analyze] Error:', errMsg, error);
    return NextResponse.json(
      { error: 'Failed to analyze business idea', detail: errMsg },
      { status: 500 }
    );
  }
}

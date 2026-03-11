/**
 * Business Analyze API
 *
 * POST /api/shipkit/analyze
 * Takes text (typed or transcribed voice) and returns a structured business analysis
 * with a rich, multi-section site preview.
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '@/lib/ai-config';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rate-limit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_TEXT_LENGTH = 5000;

const SYSTEM_PROMPT = `You are an elite product strategist and web designer for Full Stack Vibe Coder. Given a business idea, you generate a premium business brief with a stunning site preview that makes founders go "holy shit, I need this."

Your response MUST be valid JSON with this exact structure:
{
  "businessNames": [
    { "name": "Primary Name", "tagline": "A catchy tagline", "domain": "primaryname.com" },
    { "name": "Alternative Name", "tagline": "Another tagline", "domain": "altname.io" },
    { "name": "Third Option", "tagline": "Yet another tagline", "domain": "thirdoption.co" }
  ],
  "colorPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "valueProposition": "A compelling 1-2 sentence value proposition",
  "targetAudience": [
    { "segment": "Segment Name", "description": "Brief description", "painPoint": "Their #1 frustration" },
    { "segment": "Segment Name 2", "description": "Brief description", "painPoint": "Their #1 frustration" },
    { "segment": "Segment Name 3", "description": "Brief description", "painPoint": "Their #1 frustration" }
  ],
  "features": [
    { "name": "Feature Name", "description": "One-line description", "icon": "emoji" },
    { "name": "Feature Name", "description": "One-line description", "icon": "emoji" },
    { "name": "Feature Name", "description": "One-line description", "icon": "emoji" },
    { "name": "Feature Name", "description": "One-line description", "icon": "emoji" },
    { "name": "Feature Name", "description": "One-line description", "icon": "emoji" },
    { "name": "Feature Name", "description": "One-line description", "icon": "emoji" }
  ],
  "competitivePositioning": "2-3 sentences on differentiation",
  "monetization": {
    "model": "SaaS / Marketplace / Subscription / etc.",
    "suggestedPricing": "$XX/mo or $XX one-time",
    "rationale": "One sentence on why this pricing works"
  },
  "sitePreviewHtml": "FULL_HTML_STRING_SEE_BELOW",
  "message": "An enthusiastic 2-3 sentence summary ending with an invitation to build"
}

CRITICAL: The sitePreviewHtml must be a complete, self-contained HTML string with INLINE styles only (no <style> tags, no classes). It must render a STUNNING multi-section landing page preview. Use this structure:

1. HERO SECTION: Full-width gradient background using the brand colors. Large bold headline (business name). Tagline below. Two CTA buttons (primary filled, secondary outlined). A subtle pattern or decorative element.

2. FEATURES GRID: 2x3 grid of feature cards. Each has an emoji icon, bold title, short description. Cards have subtle shadows and rounded corners. Light background.

3. SOCIAL PROOF BAR: Three stats in a row (e.g., "500+ Users", "99% Uptime", "4.9★ Rating"). Use the accent color for numbers.

4. PRICING SECTION: One highlighted pricing card with a list of included features. "Get Started" button.

5. CTA FOOTER: Dark background. "Ready to [action]?" headline. Email capture input + button.

Design requirements for the HTML:
- Use the colorPalette colors consistently throughout
- Modern, clean design — generous padding (40px+ sections), good typography hierarchy
- All text must be readable (proper contrast)
- Max-width 680px, centered
- Font: system-ui, -apple-system, sans-serif
- Make it look like a REAL startup landing page, not a wireframe
- Use subtle gradients, shadows, and rounded corners
- Every section needs proper vertical spacing (60px+ between sections)
- Feature cards should have hover-ready styling (box-shadow, border-radius: 12px)
- The hero should feel premium — large text (clamp(28px, 5vw, 48px)), gradient backgrounds
- Use opacity and lighter shades for secondary text
- Include decorative dots, subtle borders, or gradient accents between sections

Guidelines:
- Business names should be creative, brandable, and domain-available (avoid dictionary words)
- Color palette should feel premium and match the industry (tech=blues/purples, health=greens, food=warm tones, finance=navy/gold)
- Features should be specific to the business, not generic
- Value proposition must name the specific problem and audience
- Monetization should be realistic and grounded
- The site preview should look SO good that the founder immediately wants to pay to build it`;

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
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this business idea and generate a premium business brief with a stunning site preview:\n\n${text}`,
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
      console.error('[Analyze] Raw response:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse analysis' },
        { status: 500 }
      );
    }

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

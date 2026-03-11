/**
 * Business Analyze API
 *
 * POST /api/shipkit/analyze
 * Takes text (typed or transcribed voice) + optional screenshot URL.
 * Returns a structured business analysis with a rich site preview.
 *
 * If a screenshot is provided, Claude sees it directly (native vision)
 * and uses it as design inspiration for colors, layout, and style.
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '@/lib/ai-config';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rate-limit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_TEXT_LENGTH = 5000;

const SYSTEM_PROMPT = `You are an elite product strategist and web designer for Full Stack Vibe Coder. Given a business idea (and optionally a screenshot of a site the user likes), you generate a premium business brief with a stunning, modern site preview.

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

IF THE USER PROVIDED A SCREENSHOT: Study it carefully. Extract:
- Color palette (primary, secondary, accent colors used)
- Layout patterns (hero style, card layouts, spacing)
- Typography feel (bold/light, serif/sans-serif, size hierarchy)
- Design style (minimal, bold, playful, corporate, dark mode, etc.)
- UI patterns (rounded corners, shadows, gradients, borders)
Then apply these visual signals to the sitePreviewHtml. The output should feel like it was designed by the same designer who made the screenshot. Match the VIBE, not copy literally.

CRITICAL: The sitePreviewHtml must be a complete, self-contained HTML string with INLINE styles only (no <style> tags, no classes, no <script>). It must render a STUNNING multi-section landing page. Here is the exact structure to follow:

SECTION 1 — HERO:
- Full-width background (gradient or solid from brand palette)
- Large bold business name (font-size: clamp(32px, 6vw, 56px), font-weight: 800)
- Tagline below (font-size: 18px, opacity: 0.85)
- Two buttons side by side: primary (filled, rounded) + secondary (outlined/ghost)
- Optional: small decorative shape or gradient orb in corner
- Padding: 60px 40px minimum

SECTION 2 — FEATURES (2x3 grid):
- Light or white background
- Section heading centered ("Why [Business Name]?" or "What you get")
- 6 cards in a 2x3 grid (use CSS grid: display:grid; grid-template-columns: repeat(2, 1fr))
- Each card: emoji icon (font-size: 28px), bold title, 1-line description
- Cards have: background white/light, border-radius: 16px, box-shadow: 0 2px 12px rgba(0,0,0,0.06), padding: 24px
- Gap between cards: 16px

SECTION 3 — SOCIAL PROOF:
- Colored background (primary or secondary, subtle)
- Three stats in a row (flex, justify: space-around)
- Big bold number + small label below each
- E.g., "500+" / "Happy Users" | "99%" / "Uptime" | "4.9★" / "Average Rating"

SECTION 4 — PRICING:
- Clean background
- One centered card with:
  - Plan name, big price (font-size: 36px, font-weight: 800)
  - 5-6 bullet points with checkmarks
  - CTA button (full-width, primary color, rounded)
- Card: max-width 380px, centered, border-radius: 20px, box-shadow

SECTION 5 — FINAL CTA:
- Dark or gradient background
- "Ready to [verb]?" headline (font-size: 28px, bold, white)
- Short subtitle
- Email input + button in a row (flex, border-radius on container)
- Subtle footer text

DESIGN RULES:
- Use the colorPalette consistently — primary for CTAs, secondary for backgrounds, accent for highlights
- Modern feel: border-radius 12-20px on everything, subtle shadows, generous whitespace
- Typography: system-ui,-apple-system,sans-serif. Headings bold (700-800), body regular (400)
- All text readable: dark text on light bg, light text on dark bg — ALWAYS check contrast
- Max-width: 680px for the whole thing, centered with margin: 0 auto
- Section padding: 48px 32px minimum, 24px gap between sections
- Buttons: padding 14px 32px, border-radius 10px, font-weight 600
- Make it look like a REAL Y Combinator startup landing page — polished, not a wireframe
- Include subtle details: gradient text for headings where appropriate, hover-style shadows on cards, pill-shaped tags

Guidelines:
- Business names should be creative, brandable, and domain-available
- Color palette should feel premium and match the industry
- If screenshot provided, match its design language closely
- Features should be specific to the business, not generic
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
    const { text, inputType = 'text', screenshotUrl } = body;

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

    // Build the user message — text + optional screenshot for Claude vision
    const userContent: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    // Add screenshot as image if provided
    if (screenshotUrl && typeof screenshotUrl === 'string') {
      try {
        // Fetch the image and convert to base64 for Claude vision
        const imageRes = await fetch(screenshotUrl);
        if (imageRes.ok) {
          const imageBuffer = await imageRes.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          const contentType = imageRes.headers.get('content-type') || 'image/png';
          const mediaType = contentType.split(';')[0] as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          });
          userContent.push({
            type: 'text',
            text: `The user uploaded this screenshot as design inspiration. Study its colors, layout, typography, and overall vibe carefully. Use these visual signals to inform the site preview design.\n\nNow analyze this business idea and generate a premium business brief:\n\n${text}`,
          });
        } else {
          // Fallback: just use text if image fetch fails
          userContent.push({
            type: 'text',
            text: `Analyze this business idea and generate a premium business brief with a stunning site preview:\n\n${text}`,
          });
        }
      } catch (imgErr) {
        console.error('[Analyze] Failed to fetch screenshot:', imgErr);
        userContent.push({
          type: 'text',
          text: `Analyze this business idea and generate a premium business brief with a stunning site preview:\n\n${text}`,
        });
      }
    } else {
      userContent.push({
        type: 'text',
        text: `Analyze this business idea and generate a premium business brief with a stunning site preview:\n\n${text}`,
      });
    }

    // Call Claude (with vision if screenshot provided)
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userContent,
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

    console.log(`[Analyze] Generated analysis for sessionId: ${sessionId}${screenshotUrl ? ' (with screenshot)' : ''}`);

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

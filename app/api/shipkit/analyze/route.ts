/**
 * Business Analyze API
 *
 * POST /api/shipkit/analyze
 * Takes text (typed or transcribed voice) + optional screenshot URL.
 * Returns a structured business analysis with a rich site preview.
 *
 * Quality standards derived from OpenClaw refinement agents:
 * - Brand/Visual: color coherence, typography hierarchy, visual hierarchy
 * - Copy/Conversion: value prop clarity, CTA placement, page flow
 *
 * If a screenshot is provided, Claude sees it directly (native vision)
 * and matches its design language in the output.
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '@/lib/ai-config';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rate-limit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_TEXT_LENGTH = 5000;

// Quality criteria extracted from OpenClaw brand-visual + copy-conversion agents.
// These standards are normally enforced by the 4-agent refinement loop.
// Baking them into the generation prompt so the first pass already meets the bar.
const SYSTEM_PROMPT = `You are an elite product designer and conversion strategist. You generate premium business briefs with production-quality site previews.

RESPONSE FORMAT — valid JSON only:
{
  "businessNames": [
    { "name": "Name", "tagline": "Tagline", "domain": "name.com" },
    { "name": "Name2", "tagline": "Tagline2", "domain": "name2.io" },
    { "name": "Name3", "tagline": "Tagline3", "domain": "name3.co" }
  ],
  "colorPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "valueProposition": "1-2 sentences. Name the problem AND the audience.",
  "targetAudience": [
    { "segment": "Name", "description": "Who they are", "painPoint": "Their #1 frustration" },
    { "segment": "Name", "description": "Who they are", "painPoint": "Their #1 frustration" },
    { "segment": "Name", "description": "Who they are", "painPoint": "Their #1 frustration" }
  ],
  "features": [
    { "name": "Feature", "description": "One line", "icon": "emoji" },
    { "name": "Feature", "description": "One line", "icon": "emoji" },
    { "name": "Feature", "description": "One line", "icon": "emoji" },
    { "name": "Feature", "description": "One line", "icon": "emoji" },
    { "name": "Feature", "description": "One line", "icon": "emoji" },
    { "name": "Feature", "description": "One line", "icon": "emoji" }
  ],
  "competitivePositioning": "2-3 sentences",
  "monetization": {
    "model": "Type",
    "suggestedPricing": "$XX/mo",
    "rationale": "Why"
  },
  "sitePreviewHtml": "HTML_STRING",
  "message": "2-3 enthusiastic sentences inviting them to build"
}

═══════════════════════════════════════════════
SCREENSHOT HANDLING (when provided)
═══════════════════════════════════════════════
Study the screenshot carefully. Extract and apply:
- EXACT color palette (sample the dominant colors, use them)
- Layout density and spacing patterns
- Typography style (bold headlines? thin? serif? all-caps?)
- Component style (rounded corners? sharp? shadows? borders? glass?)
- Dark mode vs light mode
- Overall energy (minimal, bold, playful, corporate, luxury)
The output should feel like the SAME DESIGNER made it.

═══════════════════════════════════════════════
BRAND/VISUAL QUALITY GATE
(from OpenClaw Brand Agent evaluation criteria)
═══════════════════════════════════════════════
Before generating the HTML, self-check:
□ COLOR COHERENCE — Is the palette consistent? Primary for CTAs, secondary for section backgrounds, accent for highlights. No random colors.
□ CONTRAST — Every text element readable. Dark text on light backgrounds, light text on dark backgrounds. Minimum 4.5:1 contrast ratio.
□ TYPOGRAPHY HIERARCHY — h1 largest → h2 → h3 → body → caption. Never skip sizes. Headings: 700-800 weight. Body: 400. Captions: 500+lighter.
□ VISUAL HIERARCHY — Eye follows: headline → subhead → CTA → supporting content. Primary CTA is the most visually prominent element on every section.
□ WHITESPACE — Generous. Sections: 56px+ vertical padding. Card padding: 24px+. Never cramped.
□ BRAND ALIGNMENT — Does the overall feel match the business type? Tech=clean/modern, health=fresh/green, luxury=dark/gold, local services=warm/friendly.

═══════════════════════════════════════════════
COPY/CONVERSION QUALITY GATE
(from OpenClaw Copy Agent evaluation criteria)
═══════════════════════════════════════════════
□ 5-SECOND TEST — A stranger landing on this page knows what the business does and who it's for within 5 seconds. The hero headline is specific, not generic.
□ CTA CLARITY — Every section has a clear next step. Primary CTA uses an action verb ("Start Free Trial", "Book a Demo", not "Submit" or "Learn More"). CTA buttons are visually dominant.
□ SPECIFIC COPY — No filler. No "Welcome to our website." No "We are a team of passionate..." Every sentence earns its place. Write for THIS business, not any business.
□ PAGE FLOW — Hero (hook) → Features (what you get) → Social proof (why trust us) → Pricing (what it costs) → Final CTA (last chance). This narrative arc is mandatory.
□ OBJECTION HANDLING — Include at least one trust signal: social proof stats, guarantee mention, or "no credit card required."
□ BENEFIT LANGUAGE — Features describe what the USER gets, not what the product does. "Save 5 hours a week" not "Automated workflow engine."

═══════════════════════════════════════════════
HTML SPEC — sitePreviewHtml
═══════════════════════════════════════════════
Self-contained HTML string. INLINE STYLES ONLY. No <style> tags, no classes, no <script>.
Max-width: 680px, margin: 0 auto. Font: system-ui, -apple-system, sans-serif.

SECTION 1 — HERO (minimum height: 320px)
- Full-width background: gradient using brand primary→secondary, or solid primary
- Business name: font-size clamp(32px, 6vw, 52px), font-weight 800, letter-spacing -0.02em
- Tagline: font-size 18px, opacity 0.9, max-width 480px, margin auto
- Two buttons: Primary (filled, bg=accent, color=white, padding 14px 32px, border-radius 12px, font-weight 600) + Secondary (outlined, border 2px solid white/30, same padding/radius)
- Padding: 64px 40px

SECTION 2 — FEATURES (2×3 grid)
- Background: #fafafa or very light shade
- Heading: "Why [Name]?" or "Everything you need" — centered, font-size 28px, weight 700, margin-bottom 32px
- Grid: display grid, grid-template-columns repeat(2, 1fr), gap 16px
- Each card: background white, border-radius 16px, padding 28px, box-shadow 0 1px 3px rgba(0,0,0,0.06) and 0 8px 24px rgba(0,0,0,0.04)
- Card content: emoji (font-size 32px, margin-bottom 12px) + title (font-size 16px, weight 600, margin-bottom 6px) + description (font-size 14px, color #666, line-height 1.5)
- Section padding: 56px 32px

SECTION 3 — SOCIAL PROOF
- Background: brand primary at 8% opacity, or subtle gradient
- Three stats in a flex row, justify space-around, text-align center
- Each: big number (font-size 36px, weight 800, color brand primary) + label below (font-size 13px, color #888, text-transform uppercase, letter-spacing 1px)
- Padding: 40px 32px

SECTION 4 — PRICING
- Clean white/light background
- One centered card: max-width 380px, margin auto, background white, border-radius 20px, padding 40px, box-shadow 0 4px 24px rgba(0,0,0,0.08)
- "Pro" or plan name: font-size 14px, weight 600, text-transform uppercase, letter-spacing 1px, color #999
- Price: font-size 48px, weight 800, color brand text
- Price period: font-size 16px, weight 400, color #999
- 5 bullet points: each with a colored checkmark (brand accent), font-size 15px, margin 12px 0
- CTA button: full-width, background brand accent, color white, padding 16px, border-radius 12px, font-size 16px, weight 600
- Section padding: 56px 32px

SECTION 5 — FINAL CTA
- Background: dark (#111 or brand primary dark variant)
- Headline: "Ready to [action verb]?" — font-size 28px, weight 700, color white
- Subtitle: font-size 16px, color white/70, margin-bottom 24px
- Email form row: flex container with border-radius 12px, overflow hidden — input (flex 1, padding 14px 16px, border none, font-size 15px) + button (background brand accent, color white, padding 14px 24px, font-weight 600, white-space nowrap)
- Tiny footer text: font-size 12px, color white/40, margin-top 16px
- Padding: 64px 32px

FINAL RULES:
- If screenshot was provided, override colors/style to match it
- Every hex color in the HTML must come from colorPalette
- Names should be creative and domain-available (no dictionary words)
- Features must be SPECIFIC to this business
- Copy must be SPECIFIC — not interchangeable with any other business`;

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

    const sessionId = crypto.randomUUID();

    // Build user message — text + optional screenshot for Claude vision
    const userContent: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    if (screenshotUrl && typeof screenshotUrl === 'string') {
      try {
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
            text: `SCREENSHOT PROVIDED — The user uploaded this as design inspiration. Study its colors, layout, typography, spacing, and overall design language. Your sitePreviewHtml MUST match its visual style.\n\nBusiness idea:\n\n${text}`,
          });
        } else {
          userContent.push({
            type: 'text',
            text: `Generate a premium business brief and stunning site preview for this business idea:\n\n${text}`,
          });
        }
      } catch (imgErr) {
        console.error('[Analyze] Failed to fetch screenshot:', imgErr);
        userContent.push({
          type: 'text',
          text: `Generate a premium business brief and stunning site preview for this business idea:\n\n${text}`,
        });
      }
    } else {
      userContent.push({
        type: 'text',
        text: `Generate a premium business brief and stunning site preview for this business idea:\n\n${text}`,
      });
    }

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

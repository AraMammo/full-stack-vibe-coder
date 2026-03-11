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
const SYSTEM_PROMPT = `You are a world-class web designer who builds bespoke landing pages. Every site you create looks like it was designed by a top agency charging $15k+. You NEVER use templates. Every design is unique to the business.

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
DESIGN PHILOSOPHY — sitePreviewHtml
═══════════════════════════════════════════════

You are designing a REAL landing page, not filling in a template. Each business
gets a UNIQUE design that matches its industry, audience, and energy.

TECHNICAL CONSTRAINTS:
- Self-contained HTML string. INLINE STYLES ONLY. No <style>, no classes, no <script>.
- Max-width: 680px, margin: 0 auto. Font: system-ui, -apple-system, sans-serif.
- Use modern CSS: gradients, backdrop-filter, box-shadow layering, border-radius variation,
  subtle transforms, opacity layers, and color mixing for depth.

DESIGN DIRECTION BY BUSINESS TYPE (choose the right feel):

SaaS / Tech → Dark backgrounds (#0a0a0a, #111827), neon accents, glass-morphism cards
  (background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1)),
  monospace accents for stats, tight letter-spacing on headings, gradient text effects.

Local Service / Agency → Warm palettes, real-feeling imagery descriptions, rounded friendly shapes,
  testimonial-style social proof with names and photos (use colored avatar circles), generous white space,
  soft shadows, inviting CTAs ("Book a Free Consultation").

E-commerce / DTC → Bold product-centric hero, large imagery placeholders (colored rectangles with product descriptions),
  trust badges row, star ratings, "As seen in" logo bar (use text placeholders), urgency elements,
  lifestyle-focused copy.

Health / Wellness → Clean whites and natural greens/blues, lots of breathing room, calming gradients,
  rounded everything, testimonial cards with transformation stories, certification/trust badges.

Finance / B2B → Professional dark blues and grays, sharp clean lines, data-driven social proof
  (revenue numbers, percentage improvements), minimal decoration, authority-focused design.

Creative / Lifestyle → Asymmetric layouts, bold typography (mix large and small dramatically),
  color-blocking, editorial feel, magazine-style feature sections.

LAYOUT VARIETY — DO NOT use the same layout every time. Mix these approaches:

Hero Styles (pick ONE that fits):
- Split hero: text left, visual/illustration placeholder right (use a styled colored div)
- Full-bleed gradient with centered text and floating element accents
- Dark cinematic hero with oversized typography and subtle animated-feel gradient
- Minimal white hero with a single bold statement and lots of whitespace
- Video-style hero (dark overlay on gradient with play button circle)

Content Section Styles (mix 3-5 of these, don't repeat):
- Alternating left-right feature blocks with visual placeholders
- 3-column icon + text cards with hover-state styling
- Large stat callouts with background accent colors
- Testimonial carousel-style cards (show 1-2 quotes with attributed names)
- Comparison table (us vs. them)
- Step-by-step process with numbered circles connected by a line
- Logo/trust bar (use styled text in gray as placeholder brand names)
- FAQ accordion-style (show questions with answers visible)
- Bento grid layout (mixed-size cards in a CSS grid)
- Full-width quote/testimonial with large quotation marks
- Pricing tiers side by side (if applicable to the business model)

QUALITY STANDARDS:

Typography:
- Headlines should feel BOLD and impactful. Vary sizes dramatically — hero headline
  should be 2-3x larger than section headings. Use letter-spacing and text-transform
  strategically. Mix weights (800 for headlines, 400 for body, 500 for labels).
- Line height: 1.1 for large headlines, 1.6 for body text.

Color & Depth:
- Use AT LEAST 3 layers of depth (background, surface, elevated). Not flat.
- Gradients should be subtle and sophisticated (5-15 degree angles, close color stops).
- Use semi-transparent overlays for depth (rgba blacks/whites over colored backgrounds).
- Box shadows should be layered: combine a tight shadow + a spread shadow for realism.

Spacing:
- Generous padding. Hero: 80-100px vertical. Sections: 60-80px vertical. Cards: 32-40px.
- Let the design BREATHE. Cramped = amateur. White space = premium.

Copy:
- Hero headline: Specific to THIS business. Name the outcome, not the product.
  "Turn every open house into a client" not "Real Estate Marketing Platform"
- Subheadline: Name the audience and their pain. "For agents tired of leads that ghost."
- CTAs: Action verbs specific to the business. "Start Closing More Deals" not "Get Started"
- Every section heading should make someone want to keep reading.
- No filler. No "Welcome to our website." No "We are passionate about..." Every word earns its place.
- Social proof should feel REAL: use specific numbers, named testimonials, recognizable-sounding companies.

FINAL RULES:
- The design MUST feel like a different designer built it for each different business type.
  A fitness app and an accounting firm should look NOTHING alike.
- If screenshot was provided, match its visual DNA over everything else.
- Every hex color must come from colorPalette.
- Names should be creative and domain-plausible.
- HTML should be 4000-8000 characters — rich enough to feel like a real page.
- Include at least 5 distinct visual sections with VARIETY between them.`;

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

    // ═══════════════════════════════════════════════
    // PROMPT ENRICHMENT — expand vague input into a rich brief
    // ═══════════════════════════════════════════════
    // Users often type "a dog walking app" or "candle business".
    // The enrichment step infers audience, value prop, differentiators,
    // and revenue model so the main generation prompt has rich context.
    let enrichedText = text;
    if (text.length < 800) {
      try {
        const enrichmentResponse = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1500,
          system: `You are a business strategist. The user gave a brief description of their business idea. Expand it into a rich 4-8 sentence brief that includes:
1. What the business does (be specific about the product/service)
2. Who exactly it serves (specific customer segments, not generic)
3. What makes it different from alternatives
4. How it makes money (revenue model, rough pricing)
5. The core problem it solves and why it matters

If the user already provided detailed input, clean it up and fill any gaps.
Do NOT add fictional details that contradict what the user said.
Do NOT include any preamble — just output the enriched brief directly.
Write in third person ("This business..." not "Your business...").`,
          messages: [{ role: 'user', content: text }],
        });
        const enrichedBlock = enrichmentResponse.content.find(
          (b): b is Anthropic.TextBlock => b.type === 'text'
        );
        if (enrichedBlock?.text) {
          enrichedText = enrichedBlock.text;
          console.log(`[Analyze] Enriched "${text.substring(0, 60)}..." → ${enrichedText.length} chars`);
        }
      } catch (enrichErr) {
        console.error('[Analyze] Enrichment failed, using raw input:', enrichErr);
        // Fall through with original text
      }
    }

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
            text: `SCREENSHOT PROVIDED — The user uploaded this as design inspiration. Study its colors, layout, typography, spacing, and overall design language. Your sitePreviewHtml MUST match its visual style.\n\nBusiness idea:\n\n${enrichedText}`,
          });
        } else {
          userContent.push({
            type: 'text',
            text: `Generate a premium business brief and stunning site preview for this business idea:\n\n${enrichedText}`,
          });
        }
      } catch (imgErr) {
        console.error('[Analyze] Failed to fetch screenshot:', imgErr);
        userContent.push({
          type: 'text',
          text: `Generate a premium business brief and stunning site preview for this business idea:\n\n${enrichedText}`,
        });
      }
    } else {
      userContent.push({
        type: 'text',
        text: `Generate a premium business brief and stunning site preview for this business idea:\n\n${enrichedText}`,
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

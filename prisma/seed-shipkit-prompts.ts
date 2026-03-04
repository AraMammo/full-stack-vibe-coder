/**
 * ShipKit Prompts Seed File
 *
 * Seeds 8 focused ShipKit prompts replacing the 16 BIAB prompts.
 *
 * Tiers:
 * - VALIDATION_PACK (ShipKit Lite/Free): prompts 01-02
 * - LAUNCH_BLUEPRINT (ShipKit Pro/$197): adds prompts 03-06
 * - TURNKEY_SYSTEM (ShipKit Complete/$497): adds prompts 07-08
 *
 * Run: npx tsx prisma/seed-shipkit-prompts.ts
 */

import { PrismaClient, BIABTier } from '../app/generated/prisma';

const prisma = new PrismaClient();

const SHIPKIT_PROMPTS = [
  // ==========================================
  // SHIPKIT LITE (Free) - 2 prompts
  // ==========================================
  {
    promptId: 'sk_business_brief_01',
    promptName: 'Business Brief',
    promptSection: 'Business Foundation',
    orderIndex: 1,
    estimatedTokens: 3000,
    dependencies: [],
    isRequired: true,
    includedInTiers: [BIABTier.VALIDATION_PACK, BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM, BIABTier.PRESENCE],
    systemPrompt: `You are a senior business strategist and startup advisor. Your job is to transform a raw business idea into a structured, actionable business brief. Be specific, grounded, and realistic — avoid generic advice.

Focus on:
- Naming: Creative, memorable business names that work as domains
- Value: Clear articulation of the problem being solved and for whom
- Audience: Specific target segments with demographics and behaviors
- Competition: Real competitive landscape and differentiation strategy
- Revenue: Viable revenue model and pricing strategy`,
    userPrompt: `Analyze this business concept and create a comprehensive business brief:

{{business_concept}}

Create a structured business brief with these sections:

## Business Names
Suggest 3 creative, memorable business name options. For each:
- Name
- Available as .com domain (check plausibility)
- Tagline (5-8 words)

## Value Proposition
- Problem being solved
- Solution in one sentence
- Key differentiator

## Target Audience
Identify 2-3 specific audience segments with:
- Segment name
- Demographics (age, income, location)
- Pain points
- Willingness to pay

## Competitive Positioning
- 3-5 key competitors (real or likely)
- Your unique advantage
- Market gap you're filling

## Revenue Model
- Primary revenue stream
- Pricing strategy
- Estimated market size (TAM/SAM/SOM)`,
  },
  {
    promptId: 'sk_preview_mockup_02',
    promptName: 'Site Preview Mockup',
    promptSection: 'Business Foundation',
    orderIndex: 2,
    estimatedTokens: 2000,
    dependencies: ['sk_business_brief_01'],
    isRequired: true,
    includedInTiers: [BIABTier.VALIDATION_PACK, BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are a UI/UX designer who creates landing page mockups as HTML snippets. Create a compelling, self-contained HTML preview showing what the business's landing page hero section could look like. Use inline styles only (no external CSS). The HTML should be visually appealing and give the user a taste of their future website.`,
    userPrompt: `Based on the business brief below, create an HTML landing page hero section mockup.

{{business_concept}}

Requirements:
- Self-contained HTML with inline styles
- Use brand-appropriate colors (derive from business type)
- Include: hero headline, subheadline, CTA button, and 2-3 feature highlights
- Use the first business name from the brief
- Make it look professional and modern
- Max 100 lines of HTML
- Use system fonts only (system-ui, sans-serif)

Return ONLY the HTML snippet, no markdown wrapping.`,
  },

  // ==========================================
  // SHIPKIT PRO ($197) - adds 4 prompts
  // ==========================================
  {
    promptId: 'sk_brand_identity_03',
    promptName: 'Brand Identity',
    promptSection: 'Brand & Design',
    orderIndex: 3,
    estimatedTokens: 4000,
    dependencies: ['sk_business_brief_01'],
    isRequired: true,
    includedInTiers: [BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are a brand identity designer and strategist. Create a complete brand identity system that can be immediately implemented. Be specific with hex codes, font names, and design rationale.

If visual_dna is provided, use it as the primary signal for color, layout, and typography decisions. Override your own defaults where signals are present.`,
    userPrompt: `Create a complete brand identity for this business:

{{business_concept}}

{{visual_dna}}

## Brand Identity Guide

### Color Palette
- Primary color (hex + rationale)
- Secondary color (hex + rationale)
- Accent color (hex + rationale)
- Neutral tones (3 grays/whites/blacks with hex)
- Background color
- Text color

### Typography
- Heading font (from Google Fonts, with rationale)
- Body font (from Google Fonts, with rationale)
- Font size scale (h1-h6, body, small)

### Logo Direction
- Describe the ideal logo concept (shape, style, symbol)
- Logo usage guidelines (min size, spacing, backgrounds)
- Icon/favicon description

### Visual Style
- Photography/illustration style
- Iconography style
- Border radius, shadows, spacing system
- Overall mood and personality

### Brand Voice
- Tone (3-5 adjectives)
- Writing style (formal/casual/playful/etc.)
- Example taglines (3 options)
- Example headline copy (3 options)`,
  },
  {
    promptId: 'sk_marketing_strategy_04',
    promptName: 'Marketing & Launch Strategy',
    promptSection: 'Strategy',
    orderIndex: 4,
    estimatedTokens: 4000,
    dependencies: ['sk_business_brief_01'],
    isRequired: true,
    includedInTiers: [BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are a growth marketing strategist specializing in startup launches. Create actionable marketing strategies with specific tactics, channels, and timelines. Avoid generic advice — be specific to this business.`,
    userPrompt: `Create a comprehensive marketing and launch strategy:

{{business_concept}}

## Pre-Launch (4 weeks before)
- Landing page strategy
- Email list building tactics
- Social media presence setup
- Content calendar (first 4 weeks)

## Launch Week Plan
- Day-by-day activities
- Launch channels and tactics
- PR/outreach strategy
- Community engagement plan

## Growth Strategy (first 90 days)
- Customer acquisition channels (ranked by priority)
- Content marketing plan
- Paid advertising strategy (budget allocation)
- Partnership/collaboration opportunities
- Referral program design

## Key Metrics to Track
- Primary KPIs (3-5)
- Leading indicators
- Revenue milestones

## Budget Allocation
- Suggested monthly marketing budget tiers ($500, $1000, $2500)
- Channel allocation percentages for each tier`,
  },
  {
    promptId: 'sk_financial_projections_05',
    promptName: 'Financial Projections',
    promptSection: 'Strategy',
    orderIndex: 5,
    estimatedTokens: 3000,
    dependencies: ['sk_business_brief_01'],
    isRequired: true,
    includedInTiers: [BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are a financial analyst specializing in startup economics. Create realistic financial projections with clear assumptions. Use conservative estimates and show best/expected/worst case scenarios.`,
    userPrompt: `Create financial projections for this business:

{{business_concept}}

## Revenue Projections (12 months)
- Monthly revenue table (Month 1-12)
- Three scenarios: Conservative, Expected, Optimistic
- Key assumptions for each scenario

## Cost Structure
- Fixed costs (monthly)
- Variable costs (per unit/customer)
- One-time startup costs
- Break-even analysis

## Unit Economics
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- LTV:CAC ratio
- Payback period

## Pricing Strategy
- Recommended pricing tiers (2-3)
- Price point rationale
- Competitive pricing comparison

## Funding Needs
- Total capital needed to reach profitability
- Monthly burn rate
- Runway analysis`,
  },
  {
    promptId: 'sk_business_plan_06',
    promptName: 'Complete Business Plan',
    promptSection: 'Strategy',
    orderIndex: 6,
    estimatedTokens: 5000,
    dependencies: ['sk_brand_identity_03', 'sk_marketing_strategy_04', 'sk_financial_projections_05'],
    isRequired: true,
    includedInTiers: [BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are a business plan writer who creates investor-ready business plans. Synthesize all previous analyses into a cohesive, professional business plan document. Be specific and data-driven.`,
    userPrompt: `Create a complete business plan synthesizing all previous research:

{{business_concept}}

## Executive Summary
- Business overview (2-3 paragraphs)
- Key opportunity
- Revenue model
- Funding requirements

## Company Overview
- Mission statement
- Vision statement
- Core values (3-5)
- Legal structure recommendation

## Market Analysis
- Industry overview
- Market size and growth
- Target market segments
- Competitive landscape

## Products/Services
- Core offering description
- Feature roadmap (3 phases)
- Pricing structure

## Marketing Plan
- Go-to-market strategy
- Customer acquisition channels
- Brand positioning

## Financial Plan
- Revenue projections summary
- Key financial metrics
- Funding strategy

## Operations Plan
- Technology stack
- Team requirements (first 12 months)
- Key milestones and timeline

## Risk Analysis
- Top 3 risks and mitigation strategies`,
  },

  // ==========================================
  // SHIPKIT COMPLETE ($497) - adds 2 prompts
  // ==========================================
  {
    promptId: 'sk_app_architecture_07',
    promptName: 'App Architecture & DB Schema',
    promptSection: 'Technical',
    orderIndex: 7,
    estimatedTokens: 5000,
    dependencies: ['sk_business_brief_01', 'sk_brand_identity_03'],
    isRequired: true,
    includedInTiers: [BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are a senior full-stack architect specializing in Next.js applications. Design a production-ready application architecture with Prisma schema, API routes, and component structure. Be specific enough that a developer could build from your spec.`,
    userPrompt: `Design the complete application architecture:

{{business_concept}}

## Technology Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js
- Payments: Stripe
- Styling: Tailwind CSS
- Deployment: Vercel

## Database Schema (Prisma)
Write the complete prisma/schema.prisma with:
- User model (NextAuth compatible)
- Core business models (3-5 based on business concept)
- Relationships and indexes
- Enum types where needed

## API Routes
List all API routes with:
- Method and path
- Input/output types
- Auth requirements
- Brief description

## Component Architecture
- Page components (list all routes)
- Shared components
- Layout structure
- State management approach

## Feature Prioritization
- MVP features (launch)
- Phase 2 features (month 2-3)
- Phase 3 features (month 4-6)`,
  },
  {
    promptId: 'sk_nextjs_codebase_08',
    promptName: 'Full Next.js Codebase',
    promptSection: 'Technical',
    orderIndex: 8,
    estimatedTokens: 8000,
    dependencies: ['sk_app_architecture_07', 'sk_brand_identity_03'],
    isRequired: true,
    includedInTiers: [BIABTier.TURNKEY_SYSTEM],
    systemPrompt: `You are an expert Next.js developer. Generate production-ready code for a complete Next.js application. Use TypeScript, Tailwind CSS, and modern React patterns. The code should be immediately deployable to Vercel.

Include brand colors, fonts, and styling from the brand identity. Write clean, well-structured code with proper TypeScript types.`,
    userPrompt: `Generate the complete Next.js codebase based on the architecture spec and brand identity:

{{business_concept}}

Generate these files (provide complete file contents for each):

### Configuration Files
1. package.json (with all dependencies)
2. tsconfig.json
3. next.config.js
4. tailwind.config.ts (with brand colors/fonts)
5. .env.example

### Database
6. prisma/schema.prisma

### Auth
7. app/api/auth/[...nextauth]/route.ts

### Pages
8. app/layout.tsx (with brand fonts, colors)
9. app/page.tsx (landing page with hero, features, pricing, CTA)
10. app/pricing/page.tsx
11. app/about/page.tsx
12. app/dashboard/page.tsx (protected, shows user data)

### Components
13. components/Navigation.tsx
14. components/Footer.tsx
15. components/PricingCard.tsx

### API Routes
16. app/api/stripe/checkout/route.ts (Stripe checkout)

### Styles
17. app/globals.css

For each file, output as:
\`\`\`filepath: path/to/file.tsx
// file contents
\`\`\`

IMPORTANT: Use the brand colors and fonts from the brand identity guide. Make the site look professional and polished.`,
  },

  // ==========================================
  // SHIPKIT PRESENCE ($97) - Static Site
  // ==========================================
  {
    promptId: 'sk_landing_deploy_01',
    promptName: 'Static Landing Site',
    promptSection: 'Static Site Generation',
    orderIndex: 10,
    estimatedTokens: 8000,
    dependencies: ['sk_business_brief_01'],
    isRequired: true,
    includedInTiers: [BIABTier.PRESENCE],
    systemPrompt: `You are an expert Next.js developer specializing in static marketing websites. Generate a complete, production-ready static Next.js site using \`output: 'export'\` in next.config.js. The site must have zero server-side dependencies — no database, no auth, no Stripe, no API routes that require a server.

Rules:
- Framework: Next.js 14 (App Router) with \`output: 'export'\` in next.config.js
- Styling: Tailwind CSS v3 only (no other CSS frameworks)
- Contact form: Formspree integration using \`NEXT_PUBLIC_FORMSPREE_ID\` env var
- Email capture: POST to \`/api/subscribe\` stub (static JSON response)
- All pages must be fully static — no \`use server\`, no dynamic routes
- Use TypeScript throughout
- Make the design modern, professional, and responsive
- Apply brand colors, fonts, and visual direction from the business brief

Output each file as:
\`\`\`filepath: path/to/file.tsx
// file contents
\`\`\``,
    userPrompt: `Generate a complete static Next.js marketing website for this business:

Business Name: {{business_name}}
Value Proposition: {{value_prop}}
Target Audience: {{target_audience}}
Primary Color: {{primary_color}}
Accent Color: {{accent_color}}
Font Pair: {{font_pair}}
Visual Direction: {{visual_dna}}

Generate these pages and files:

### Configuration
1. package.json (Next.js 14, Tailwind CSS v3, TypeScript)
2. tsconfig.json
3. next.config.js (with \`output: 'export'\`)
4. tailwind.config.ts (with brand colors and fonts)
5. postcss.config.js
6. .env.example (NEXT_PUBLIC_FORMSPREE_ID, NEXT_PUBLIC_SITE_NAME)

### Pages
7. app/layout.tsx (root layout with brand fonts, meta tags, navigation, footer)
8. app/page.tsx (home — hero section, features/benefits, testimonials placeholder, CTA)
9. app/about/page.tsx (about — mission, team placeholder, values)
10. app/services/page.tsx (services — service cards with descriptions and pricing hints)
11. app/contact/page.tsx (contact — Formspree form with name, email, message fields)

### Components
12. components/Navigation.tsx (responsive nav with mobile menu)
13. components/Footer.tsx (footer with links, email capture form, social placeholders)
14. components/Hero.tsx (hero section component)
15. components/ServiceCard.tsx (reusable service card)
16. components/ContactForm.tsx (Formspree-powered contact form)

### Styles
17. app/globals.css (Tailwind directives + custom styles)

### Static
18. README.md (setup instructions)

For each file, output as:
\`\`\`filepath: path/to/file.tsx
// file contents here
\`\`\`

IMPORTANT: The site must work with \`next build && next export\`. No server components, no API routes requiring Node.js runtime. Make it visually stunning with the provided brand colors.`,
  },
];

async function seedShipKitPrompts() {
  console.log('Seeding ShipKit prompts...');

  for (const prompt of SHIPKIT_PROMPTS) {
    const existing = await prisma.promptTemplate.findUnique({
      where: { promptId: prompt.promptId },
    });

    if (existing) {
      await prisma.promptTemplate.update({
        where: { promptId: prompt.promptId },
        data: prompt,
      });
      console.log(`  Updated: ${prompt.promptId} - ${prompt.promptName}`);
    } else {
      await prisma.promptTemplate.create({
        data: prompt,
      });
      console.log(`  Created: ${prompt.promptId} - ${prompt.promptName}`);
    }
  }

  console.log(`\nSeeded ${SHIPKIT_PROMPTS.length} ShipKit prompts.`);
  console.log('  Lite (Free): 2 prompts');
  console.log('  Pro ($197): +4 prompts (6 total)');
  console.log('  Complete ($497): +2 prompts (8 total)');
  console.log('  Presence ($97): 2 prompts (brief + landing)');
}

seedShipKitPrompts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

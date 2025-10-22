import { PrismaClient, BIABTier } from '../app/generated/prisma';

const prisma = new PrismaClient();

// Tier definitions for prompts
const ALL_TIERS = [BIABTier.VALIDATION_PACK, BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM];
const PAID_TIERS = [BIABTier.LAUNCH_BLUEPRINT, BIABTier.TURNKEY_SYSTEM];

const prompts = [
  {
    promptId: "business_model_01",
    promptName: "Business Model Breakdown",
    promptSection: "Business Model & Market Research",
    systemPrompt: "You are an expert business strategist. Analyze business models with precision, focusing on revenue, costs, and scalability.",
    userPrompt: "Analyze business model for: {{business_concept}}. Cover: revenue streams (2-3 main sources), customer acquisition strategy, cost structure, unit economics, scalability path. Provide 1-2 real-world examples. Keep response under 1500 words. Focus on actionable insights.",
    isRequired: true,
    orderIndex: 1,
    estimatedTokens: 1950, // was 2500
    dependencies: [],
    includedInTiers: ALL_TIERS, // Core validation prompt
  },
  {
    promptId: "competitive_analysis_02",
    promptName: "Competitive Analysis & Market Gaps",
    promptSection: "Business Model & Market Research",
    systemPrompt: "You are a market research analyst. Identify competitive positioning opportunities through user pain points and unmet needs.",
    userPrompt: "Competitive analysis for: {{business_concept}}. Identify: 3-5 direct competitors, 2-3 indirect competitors, key differentiation opportunities, market gaps. Use concise comparison table format. Under 1000 words.",
    isRequired: true,
    orderIndex: 2,
    estimatedTokens: 1300, // was 3000
    dependencies: [],
    includedInTiers: ALL_TIERS, // Core validation prompt
  },
  {
    promptId: "target_audience_03",
    promptName: "Target Audience & Pain Points",
    promptSection: "Business Model & Market Research",
    systemPrompt: "You are a customer insights strategist. Build detailed customer personas with demographics, psychographics, and behavioral data.",
    userPrompt: "Define target audience for: {{business_concept}}. Include: 2-3 primary personas (demographics, psychographics), core pain points (top 5), buying triggers. Use structured format. Under 1200 words.",
    isRequired: true,
    orderIndex: 3,
    estimatedTokens: 1625, // was 2500
    dependencies: [],
    includedInTiers: ALL_TIERS, // Core validation prompt
  },
  {
    promptId: "brand_positioning_04",
    promptName: "Brand Strategy & Positioning",
    promptSection: "Branding & Visual Identity",
    systemPrompt: "You are a brand strategist. Create differentiated positioning grounded in emotional truth and rational value.",
    userPrompt: "Brand strategy for: {{business_concept}} based on: {{target_audience_03}} and {{competitive_analysis_02}}. Cover: unique value proposition (1 sentence), brand personality (5 traits), positioning statement, key messaging pillars (3-4). Concise and actionable. Under 1300 words.",
    isRequired: true,
    orderIndex: 4,
    estimatedTokens: 1625, // was 2400
    dependencies: ["target_audience_03", "competitive_analysis_02"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "visual_identity_05",
    promptName: "Logo & Visual Identity",
    promptSection: "Branding & Visual Identity",
    systemPrompt: "You are a brand designer. Create visual identities that capture brand intent, scalability, and work across all mediums.",
    userPrompt: "Visual identity for: {{business_concept}} based on {{brand_positioning_04}}. Specify: color palette (3-5 colors with hex codes), typography (2-3 fonts), logo concept (brief description), design mood. Keep focused. Under 1500 words.",
    isRequired: true,
    orderIndex: 5,
    estimatedTokens: 1950, // was 2800
    dependencies: ["brand_positioning_04"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "mvp_definition_06",
    promptName: "MVP Definition & Product Roadmap",
    promptSection: "Product & Service Development",
    systemPrompt: "You are a product architect. Define ruthlessly focused MVPs that solve core problems completely.",
    userPrompt: "Define MVP for: {{business_concept}} based on {{target_audience_03}}. List: 5-7 core features (priority ranked), tech requirements, 3-month roadmap (milestones only). Must-haves only. Under 1400 words.",
    isRequired: true,
    orderIndex: 6,
    estimatedTokens: 1625, // was 3200
    dependencies: ["target_audience_03"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "pricing_strategy_07",
    promptName: "Product Pricing Strategy",
    promptSection: "Product & Service Development",
    systemPrompt: "You are a pricing architect. Design pricing that maximizes value capture while remaining market-competitive.",
    userPrompt: "Pricing strategy for: {{business_concept}} considering {{target_audience_03}}, {{competitive_analysis_02}}, {{mvp_definition_06}}. Recommend: pricing model, 2-3 tier structure, psychological pricing tactics. Include simple comparison table. Under 1600 words.",
    isRequired: true,
    orderIndex: 7,
    estimatedTokens: 1950, // was 3500
    dependencies: ["target_audience_03", "competitive_analysis_02", "mvp_definition_06"],
    includedInTiers: ALL_TIERS, // Core validation prompt
  },
  {
    promptId: "hiring_plan_08",
    promptName: "Hiring Plan & Key Roles",
    promptSection: "Operations & Team Building",
    systemPrompt: "You are an organizational architect. Define optimal team structures that minimize burn while maximizing output.",
    userPrompt: "Hiring plan for: {{business_concept}} based on {{mvp_definition_06}}. Outline: first 5 hires (role, timing, salary range), 12-month hiring roadmap, key responsibilities. Brief and structured. Under 1500 words.",
    isRequired: true,
    orderIndex: 8,
    estimatedTokens: 1950, // was 2500
    dependencies: ["mvp_definition_06"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "gtm_launch_plan_09",
    promptName: "Go-To-Market Launch Plan",
    promptSection: "Operations & Team Building",
    systemPrompt: "You are a GTM strategist. Create sequenced launch frameworks with clear KPIs and feedback cycles.",
    userPrompt: "Go-to-market plan for: {{business_concept}} using {{mvp_definition_06}}, {{target_audience_03}}, {{pricing_strategy_07}}. Detail: 90-day launch phases, key channels (top 3-5), success metrics, budget allocation. Action-focused. Under 1600 words.",
    isRequired: true,
    orderIndex: 9,
    estimatedTokens: 1950, // was 3500
    dependencies: ["mvp_definition_06", "target_audience_03", "pricing_strategy_07"],
    includedInTiers: ALL_TIERS, // Core validation prompt
  },
  {
    promptId: "customer_acquisition_10",
    promptName: "Customer Acquisition Strategy",
    promptSection: "Go-To-Market Strategy & Growth",
    systemPrompt: "You are a performance marketing strategist. Design channel strategies with CAC/LTV logic and optimization frameworks.",
    userPrompt: "Customer acquisition for: {{business_concept}} targeting {{target_audience_03}} at {{pricing_strategy_07}}. Cover: 3-5 primary channels, CAC estimation, conversion funnel, first 100 customers strategy. Practical and concise. Under 1600 words.",
    isRequired: true,
    orderIndex: 10,
    estimatedTokens: 1950, // was 3500
    dependencies: ["target_audience_03", "pricing_strategy_07"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "social_content_11",
    promptName: "Social Media Content Strategy",
    promptSection: "Go-To-Market Strategy & Growth",
    systemPrompt: "You are a content strategist. Develop storytelling calendars driven by audience psychology and platform algorithms.",
    userPrompt: "Social media strategy for: {{business_concept}} aligned with {{brand_positioning_04}} and {{target_audience_03}}. Provide: platform selection (2-3 platforms), content pillars (4-5), posting schedule, 10 sample post ideas. Brief and actionable. Under 1400 words.",
    isRequired: true,
    orderIndex: 11,
    estimatedTokens: 1625, // was 3000
    dependencies: ["brand_positioning_04", "target_audience_03"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "financial_forecast_12",
    promptName: "Revenue & Profitability Forecast",
    promptSection: "Financial Planning & Projections",
    systemPrompt: "You are a financial analyst. Create 12-month projections with realistic assumptions and scenario planning.",
    userPrompt: "Financial forecast for: {{business_concept}} using {{pricing_strategy_07}} and {{customer_acquisition_10}}. Project: 3-year revenue (table format), key assumptions, break-even analysis, funding needs. Numbers-focused. Under 1400 words.",
    isRequired: true,
    orderIndex: 12,
    estimatedTokens: 1625, // was 3500
    dependencies: ["pricing_strategy_07", "customer_acquisition_10"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "legal_compliance_13",
    promptName: "Legal & Compliance Checklist",
    promptSection: "Legal & Compliance",
    systemPrompt: "You are a legal operations consultant. List foundational legal requirements prioritized by urgency and risk.",
    userPrompt: "Legal checklist for: {{business_concept}}. List: business structure recommendation, required licenses/permits, key contracts needed, IP protection, compliance requirements (top 5). Structured checklist format. Under 1500 words.",
    isRequired: true,
    orderIndex: 13,
    estimatedTokens: 1950, // was 2800
    dependencies: [],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "tech_stack_14",
    promptName: "Tech Stack Recommendations",
    promptSection: "Tech & Automation Setup",
    systemPrompt: "You are a systems architect. Recommend scalable, secure, cost-effective tech stacks with modern tools.",
    userPrompt: "Tech stack for: {{business_concept}} based on {{mvp_definition_06}}. Recommend: frontend, backend, database, hosting, key integrations. Include rationale for each. Cost-conscious choices. Under 1500 words.",
    isRequired: true,
    orderIndex: 14,
    estimatedTokens: 1950, // was 3000
    dependencies: ["mvp_definition_06"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "pitch_deck_15",
    promptName: "Startup Pitch Deck Outline",
    promptSection: "Investor Pitch & Funding Strategy",
    systemPrompt: "You are a venture storytelling expert. Create compelling 10-slide pitch decks with narrative logic and data.",
    userPrompt: "Pitch deck outline for: {{business_concept}} using {{business_model_01}}, {{competitive_analysis_02}}, {{financial_forecast_12}}. Structure: 10 slides with key points per slide (3-5 bullets each). Concise and investor-focused. Under 1600 words.",
    isRequired: true,
    orderIndex: 15,
    estimatedTokens: 1950, // was 3200
    dependencies: ["business_model_01", "competitive_analysis_02", "financial_forecast_12"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
  {
    promptId: "replit_site_16",
    promptName: "Website Builder AI Prompt",
    promptSection: "Launch Tools",
    systemPrompt: "You are a technical founder. Generate complete AI coding prompts with architecture, routes, components, and deployment steps.",
    userPrompt: "Website build prompt for: {{business_concept}} reflecting {{brand_positioning_04}}, {{visual_identity_05}}, {{mvp_definition_06}}. Specify: page structure (5-7 pages), key sections per page, features, design direction. Developer-ready brief. Under 1700 words.",
    isRequired: true,
    orderIndex: 16,
    estimatedTokens: 2275, // was 3500
    dependencies: ["brand_positioning_04", "visual_identity_05", "mvp_definition_06"],
    includedInTiers: PAID_TIERS, // Launch Blueprint and above
  },
];

async function seed() {
  console.log('🌱 Seeding Business in a Box prompts...\n');

  let created = 0;
  let updated = 0;

  for (const prompt of prompts) {
    try {
      const result = await prisma.promptTemplate.upsert({
        where: { promptId: prompt.promptId },
        update: prompt,
        create: prompt,
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
        console.log(`✓ Created: ${prompt.promptName}`);
      } else {
        updated++;
        console.log(`↻ Updated: ${prompt.promptName}`);
      }
    } catch (error: any) {
      console.error(`✗ Failed: ${prompt.promptName}`, error.message);
    }
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total: ${prompts.length}`);
}

seed()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

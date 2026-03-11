# Full Stack Vibe Coder (FSVC)

## What This Is

FSVC is a provisioning factory at fullstackvibecoder.com. A customer describes their business idea (text, voice, or screenshot), and we build and deploy a full-stack web app — website, user accounts, payments — live on their own URL.

**$497 one-time build. $49/mo hosting (30-day free trial). Cancel anytime — you keep everything.**

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router), TypeScript, Tailwind CSS v3 |
| Database | PostgreSQL via Neon (Prisma ORM) |
| Auth | NextAuth.js (Google OAuth) |
| Payments | Stripe (Checkout + Connect Standard accounts for customer apps) |
| AI | Anthropic Claude (`CLAUDE_MODEL` env var, default `claude-sonnet-4-20250514`) |
| Voice | OpenAI Whisper (transcription) |
| Refinement | OpenClaw — 4 specialist agents x 3 cycles (brand-visual, copy-conversion, structure, code-quality) |
| Storage | Supabase Storage (screenshots, voice notes, deliverables) |
| Hosting | Vercel (FSVC team account for customer deploys) |
| Logo | Dumpling AI |
| Email | Resend (domain provisioning) |
| Fonts | Syne (headings), Plus Jakarta Sans (body), JetBrains Mono (code) |

---

## Core Flow

```
User describes idea (chat/voice/screenshot)
  → /api/shipkit/analyze (Claude with OpenClaw quality gates baked in)
  → Returns: business brief + live site preview HTML + brand palette
  → Canvas panel shows preview (AnalysisCanvas.tsx)
  → User clicks "Build & Deploy" ($497)
  → /api/create-checkout → Stripe
  → Stripe webhook → creates Project → triggers runBuild()
  → Orchestrator runs 8 prompts sequentially
  → Provisioning pipeline: Neon DB → Stripe Connect → GitHub → Vercel → verify live
  → Customer gets: live URL, GitHub repo, Stripe onboarding, admin dashboard
```

---

## Project Structure

```
app/
  page.tsx                          # Landing page (chat + canvas split-screen)
  components/
    ChatInterface.tsx               # Chat with voice + screenshot upload
    AnalysisCanvas.tsx              # 3-tab preview panel (site, brief, brand)
  api/
    shipkit/analyze/                # AI intake analysis (Claude vision + quality gates)
    create-checkout/                # Stripe session creation
    checkout/build/                 # Build-specific checkout
    checkout/presence/              # $97 static site checkout
    webhooks/stripe/                # Payment lifecycle → triggers builds
    payment/verify/                 # Post-payment verification
    projects/[id]/
      build/                        # Trigger full build pipeline
      refine/                       # OpenClaw refinement cycles
      status/                       # Project status polling
      change/                       # Iteration loop (change requests)
    project/[id]/
      domain/                       # Custom domain management
      hosting/                      # Hosting subscription management
      redeploy/                     # Manual redeploy trigger
      eject/                        # Self-hosting migration
      transfer/                     # Ownership transfer
    upload-screenshot/              # Screenshot upload to Supabase Storage
    transcribe/                     # Voice → text (Whisper)
    billing/{portal,upgrade}/       # Stripe customer portal
    conversations/message/          # Streaming chat
    contact/                        # Marketing contact form
    stats/                          # Public stats
  dashboard/                        # Customer project management
    project/[id]/                   # Individual project detail + hosting controls
  auth/{signin,verify,error}/       # Auth pages
  checkout/                         # Pre-payment review page
  payment/success/                  # Post-payment redirect
  get-started/                      # Pricing page
  shipkit/[projectId]/              # Project refinement interface

lib/
  ai-config.ts                      # CLAUDE_MODEL (env var driven)
  db.ts                             # Prisma client
  auth.ts                           # NextAuth config
  stripe.ts                         # Stripe client
  storage.ts                        # Supabase Storage helpers
  rate-limit.ts                     # Request throttling

  agents/
    shipkit-orchestrator.ts         # 8-prompt sequential execution engine

  openclaw/                         # Multi-agent refinement framework
    agent.ts                        # evaluate() — individual agent evals
    refinement-runner.ts            # runRefinementPipeline() — 4 agents x 3 cycles
    synthesizer.ts                  # Consolidate agent feedback
    regenerator.ts                  # Apply changes back to files
    skills/
      brand-visual.ts               # Color, typography, visual hierarchy
      copy-conversion.ts            # Value prop, CTAs, benefit language
      structure.ts                  # Page flow, component organization
      code-quality.ts               # Code standards, accessibility

  orchestrator/
    build-orchestrator.ts           # runBuild() — main build entry point

  services/
    provisioning-pipeline.ts        # 8-step infra deployment (Neon→GitHub→Vercel→Stripe→Resend)
    neon-provisioning.ts            # PostgreSQL database provisioning
    vercel-provisioning.ts          # Vercel project + env vars + deploy
    stripe-connect.ts               # Standard accounts for customer payments
    claude-codegen.ts               # Code generation + GitHub push (pushToGitHubOrg)
    resend-provisioning.ts          # Email domain setup
    eject-service.ts                # Self-hosting migration + guide generation
    transfer-service.ts             # Multi-service ownership transfer
    code-validator.ts               # Validate generated code
    embedding-service.ts            # Claude embeddings
    dumpling-client.ts              # Logo generation

  intake/
    classifier.ts                   # classifyIndustry()
    profile-extractor.ts            # extractProfile()
    visionAnalysis.ts               # extractVisualDNA() — image → design signals

  iteration/
    changeHandler.ts                # processChangeRequest() — user-requested changes

  provisioning/
    staticDeploy.ts                 # deployStaticSite() — Presence product

  templates/
    engine.ts                       # buildFromTemplate()
    registry.ts                     # Template catalog
    types.ts                        # IndustryProfile, TemplateConfig

  delivery/
    organize-deliverables.ts        # Package deliverables for download
    convert-to-pdf.ts               # Markdown → PDF conversion

prisma/
  schema.prisma                     # Data models + enums
  seed-shipkit-prompts.ts           # 8 prompt templates
```

---

## Key Data Models

| Model | Purpose |
|-------|---------|
| User | Identity + auth (Google OAuth) |
| Project | Customer project (status, URLs, industry profile, error tracking) |
| DeployedApp | Infrastructure record (Neon, Vercel, GitHub, Stripe Connect, domain, Resend) |
| HostingSubscription | $49/mo recurring billing per deployed app |
| Conversation | Chat session with extracted profile data |
| ConversationMessage | Individual chat turns |
| ChangeRequest | Iteration: user message → file changes → redeploy |
| RefinementCycle | OpenClaw evaluation tracking (agent scores, findings, regeneration) |
| AgentEvaluation | Individual agent scores per cycle |
| Payment | Transaction records (BUILD, HOSTING, REFUND) |
| TransferRequest | Ownership transfer workflows |

**Key Enums:**
- `ProjectStatus`: INTAKE → CUSTOMIZING → PREVIEWING → PROVISIONING → LIVE / FAILED
- `HostingStatus`: PROVISIONING → ACTIVE → SUSPENDED / CANCELLED / EJECTED / TRANSFERRED
- Tier values: `VALIDATION_PACK` (free preview), `TURNKEY_SYSTEM` ($497 build). `LAUNCH_BLUEPRINT` exists in schema but is deprecated.

---

## Environment Variables

See `.env.example` for the full list. Critical:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL |
| `ANTHROPIC_API_KEY` | Claude AI |
| `CLAUDE_MODEL` | Model ID override (optional) |
| `STRIPE_SECRET_KEY` | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `STRIPE_HOSTING_PRICE_ID` | $49/mo recurring |
| `STRIPE_PRESENCE_PRICE_ID` | $97 static site |
| `GITHUB_TOKEN` / `GITHUB_PAT` | GitHub repo creation + code push |
| `GITHUB_ORG_NAME` | GitHub org for customer repos |
| `VERCEL_TOKEN` | Vercel project deploy |
| `VERCEL_TEAM_ID` | Vercel team for customer projects |
| `NEON_API_KEY` | Neon Management API |
| `OPENAI_API_KEY` | Whisper transcription |
| `RESEND_API_KEY` | Email domain provisioning |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access |

---

## Commands

```bash
npm run dev          # Local development
npm run build        # prisma generate + next build (NODE_OPTIONS=--max-old-space-size=4096)
npm run db:push      # Push schema changes to DB
npm run db:sync      # Alias for db:push
npx prisma db seed   # Seed prompt templates
```

---

## Rules

### Code Style
- TypeScript strict mode. No `any` unless unavoidable.
- Tailwind CSS for all styling. Custom theme tokens defined in `tailwind.config.ts`.
- Use the semantic color tokens: `bg-base`, `bg-surface`, `bg-raised`, `text-fsvc-text`, `text-fsvc-text-secondary`, `text-fsvc-text-disabled`, `border-border`, `text-accent`, `text-accent-2`, `text-success`, `text-error`, `text-warning`.
- All AI calls go through `CLAUDE_MODEL` from `lib/ai-config.ts`. Never hardcode model IDs.

### Copy & UX
- All customer-facing text uses **benefit language**, never technical jargon.
- Users don't know "auth", "database", "GitHub", "eject", "ORM", etc.
- Say: "user accounts", "your own website", "accept payments", "you keep everything", "cancel anytime".
- No filler copy. Every sentence earns its place.

### Architecture
- Do NOT touch the existing Builder provisioning pipeline unless a task explicitly targets it.
- Prisma is the primary ORM. Some legacy routes still use Drizzle — migrate them when touching those files.
- OpenClaw quality standards (brand-visual + copy-conversion) are baked into the `/api/shipkit/analyze` prompt. The full 4-agent refinement loop runs post-build via `/api/projects/[id]/refine`.
- Screenshots are sent to Claude as base64 vision input (native multimodal), not through a separate Vision API.
- The landing page uses a split-screen layout: chat on left, canvas preview panel on right.

### What Not to Touch
- Prompt templates `sk_business_brief_01` through `sk_nextjs_codebase_08` in the DB
- Builder provisioning pipeline (`lib/services/provisioning-pipeline.ts`) unless explicitly asked
- Stripe pricing configuration

### Build Phases (Roadmap)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Static Site Engine | Partial | `sk_landing_deploy_01` prompt, `staticDeploy.ts`, Presence checkout |
| Phase 2 — Visual DNA | Partial | `visionAnalysis.ts` exists, screenshot upload works, Claude vision active in analyze |
| Phase 3 — Iteration Loop | Partial | `changeHandler.ts` exists, `ChangeRequest` model in schema, needs dashboard UI |
| Phase 4 — Telegram (OpenClaw) | Not started | Telegram bot intake for Presence product |

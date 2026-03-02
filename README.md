# ShipKit by FullStack Vibe Coder

ShipKit builds and hosts full-stack web applications. Customers describe their business — voice note or text — and get a working app with database, auth, payments, and email, deployed and live.

**$497 to build. $49/mo to host. Eject anytime.**

## How It Works

1. Customer describes their business idea (chat or voice note)
2. Claude AI analyzes the concept and generates a business brief
3. 8 specialized AI prompts execute: brand identity, market research, financial projections, marketing strategy, app architecture, and full Next.js codebase
4. Provisioning pipeline deploys everything: Supabase database, Vercel hosting, GitHub repo, Stripe Connect payments
5. Customer gets a live URL, admin dashboard, and Stripe onboarding link

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL via Supabase (Prisma ORM)
- **Auth**: NextAuth.js (Google OAuth)
- **Payments**: Stripe (Checkout, Webhooks, Connect)
- **AI**: Anthropic Claude (claude-sonnet-4-5)
- **Voice**: OpenAI Whisper (transcription)
- **Hosting**: Vercel (ShipKit team account)
- **Email**: SendGrid (transactional), Resend (domain provisioning)
- **Storage**: Supabase Storage
- **Logo Generation**: Dumpling AI

## Project Structure

```
app/
  api/                    # 34 API routes
    shipkit/              # Core analyze + execute endpoints
    create-checkout/      # Stripe checkout (single $497 offering)
    webhooks/stripe/      # Stripe webhook handler
    project/[id]/         # Domain, hosting, redeploy, eject APIs
    delivery/             # ZIP download endpoints
    auth/                 # NextAuth handler
  dashboard/              # User dashboard + project detail
  get-started/            # Pricing / checkout page
  page.tsx                # Landing page with chat interface

lib/
  agents/
    shipkit-orchestrator.ts   # 8-prompt execution engine
  services/
    provisioning-pipeline.ts  # Full infra deployment (9 steps)
    supabase-provisioning.ts  # Per-customer Supabase projects
    vercel-provisioning.ts    # Vercel project + deploy + env vars
    stripe-connect.ts         # Express accounts for customer payments
    resend-provisioning.ts    # Email domain setup
    claude-codegen.ts         # Code generation + GitHub push
    eject-service.ts          # Self-hosting migration
  delivery/
    package-biab-deliverables.ts  # ZIP packaging

prisma/
  schema.prisma           # 15 models, 6 enums
  seed-shipkit-prompts.ts # 8 prompt templates
```

## Setup

```bash
npm install
cp .env.example .env.local   # Fill in all keys
npx prisma db push
npx prisma db seed
npm run dev
```

## Environment Variables

See `.env.example` for the full list. Critical ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection |
| `ANTHROPIC_API_KEY` | Claude AI for all generation |
| `STRIPE_SECRET_KEY` | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `STRIPE_HOSTING_PRICE_ID` | $49/mo hosting subscription |
| `GITHUB_TOKEN` / `GITHUB_PAT` | Push code to GitHub org |
| `GITHUB_ORG_NAME` | GitHub org for customer repos |
| `VERCEL_TOKEN` | Deploy customer apps |
| `VERCEL_TEAM_ID` | Vercel team for customer projects |
| `SUPABASE_MANAGEMENT_API_KEY` | Create per-customer databases |
| `SUPABASE_ORGANIZATION_ID` | Supabase org for new projects |
| `RESEND_API_KEY` | Email domain provisioning |

## Pricing Model

| Item | Price |
|------|-------|
| Build fee | $497 one-time |
| Hosting | $49/mo (30-day free trial) |
| Free preview | $0 (2 prompts: business brief + mockup) |

Internal tier enum values: `VALIDATION_PACK` (free), `LAUNCH_BLUEPRINT` (legacy), `TURNKEY_SYSTEM` ($497)

## Deployment

The ShipKit platform itself deploys on Vercel. Customer apps deploy to the ShipKit Vercel team account with per-project env vars.

```bash
npm run build    # Runs prisma generate + next build
vercel --prod    # Deploy to production
```

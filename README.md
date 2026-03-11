# Full Stack Vibe Coder

Describe your business. Get a live app — website, user accounts, and payments — built and deployed in minutes.

**$497 to build. $49/mo to host. Cancel anytime — you keep everything.**

## How It Works

1. Describe your business idea (text or voice note), optionally upload a screenshot of a site you like
2. AI analyzes the concept, generates a business brief and live site preview
3. After payment, 8 specialized AI prompts execute: brand identity, market research, financial projections, marketing strategy, app architecture, and full codebase
4. Provisioning pipeline deploys everything: database, hosting, code repo, payment processing
5. You get a live URL, admin dashboard, and payment onboarding link

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL (Neon) via Prisma ORM
- **Auth**: NextAuth.js (Google OAuth)
- **Payments**: Stripe (Checkout, Webhooks, Connect)
- **AI**: Anthropic Claude + OpenClaw refinement framework (4 agents x 3 cycles)
- **Voice**: OpenAI Whisper (transcription)
- **Hosting**: Vercel
- **Storage**: Supabase Storage
- **Logo Generation**: Dumpling AI

## Project Structure

```
app/
  api/
    shipkit/              # Core analyze + execute endpoints
    create-checkout/      # Stripe checkout
    webhooks/stripe/      # Stripe webhook handler
    project/[id]/         # Domain, hosting, redeploy, eject APIs
    payment/verify/       # Post-payment verification
  dashboard/              # User dashboard + project detail
  get-started/            # Pricing page
  page.tsx                # Landing page with chat + canvas preview

  components/
    ChatInterface.tsx     # Chat with voice + screenshot upload
    AnalysisCanvas.tsx    # Split-screen preview panel (site, brief, brand)

lib/
  agents/
    shipkit-orchestrator.ts   # 8-prompt execution engine
  openclaw/                   # Multi-agent refinement framework
    agent.ts, refinement-runner.ts, regenerator.ts, synthesizer.ts
  services/
    provisioning-pipeline.ts  # Full infra deployment
    vercel-provisioning.ts    # Vercel project + deploy
    stripe-connect.ts         # Standard accounts for customer payments
    claude-codegen.ts         # Code generation + GitHub push
    eject-service.ts          # Self-hosting migration
  ai-config.ts                # Claude model config (env var driven)

prisma/
  schema.prisma               # Data models
  seed-shipkit-prompts.ts     # 8 prompt templates
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
| `DATABASE_URL` | PostgreSQL connection (Neon) |
| `ANTHROPIC_API_KEY` | Claude AI for all generation |
| `CLAUDE_MODEL` | Model ID (default: claude-sonnet-4-20250514) |
| `STRIPE_SECRET_KEY` | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `STRIPE_HOSTING_PRICE_ID` | $49/mo hosting subscription |
| `GITHUB_TOKEN` / `GITHUB_PAT` | Push code to GitHub org |
| `GITHUB_ORG_NAME` | GitHub org for customer repos |
| `VERCEL_TOKEN` | Deploy customer apps |
| `VERCEL_TEAM_ID` | Vercel team for customer projects |
| `RESEND_API_KEY` | Email domain provisioning |

## Deployment

```bash
npm run build    # Runs prisma generate + next build
vercel --prod    # Deploy to production
```

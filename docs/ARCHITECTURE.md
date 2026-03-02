# ShipKit System Architecture — Printable Reference

Generated 2026-03-02. Print at 100% scale on A3/Tabloid for best readability.

---

## 1. HIGH-LEVEL SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                                  │
│                                                                             │
│   Browser ──► Landing Page ──► Chat / Voice ──► Free Preview ──► Pay $497   │
│                   │                │                  │              │       │
│                   ▼                ▼                  ▼              ▼       │
│             page.tsx        /api/shipkit/       Dashboard      Stripe       │
│           (ChatInterface)    analyze          (preview)      Checkout       │
│                                │                                 │          │
│                                ▼                                 ▼          │
│                        chat_submissions              Stripe Webhook         │
│                        (sessionId saved)         /api/webhooks/stripe       │
│                                                          │                  │
│                                                          ▼                  │
│                                                   Create Project            │
│                                                   Create Payment            │
│                                                          │                  │
│                                                          ▼                  │
│                                                  /api/shipkit/execute       │
│                                                          │                  │
│                                                          ▼                  │
│                                               ┌──────────────────┐          │
│                                               │   ORCHESTRATOR   │          │
│                                               │  (8 AI Prompts)  │          │
│                                               └────────┬─────────┘          │
│                                                        │                    │
│                                          ┌─────────────┼─────────────┐      │
│                                          ▼             ▼             ▼      │
│                                      Code Gen    Logo Gen      Delivery     │
│                                      (Claude)   (Dumpling)     (ZIP/PDF)    │
│                                          │                                  │
│                                          ▼                                  │
│                                ┌─────────────────────┐                      │
│                                │ PROVISIONING PIPELINE│                      │
│                                │  (9 sequential steps)│                      │
│                                └──────────┬──────────┘                      │
│                                           │                                 │
│              ┌────────────┬───────────┬───┴────┬────────────┬────────┐      │
│              ▼            ▼           ▼        ▼            ▼        ▼      │
│          Supabase     Stripe      GitHub    Vercel     Verify    Hosting    │
│          Project     Connect       Push     Deploy     HTTP200    $49/mo    │
│          + Migrate   Account     (to org)   + Env               Sub+Trial  │
│                                                                             │
│                                          ▼                                  │
│                                   CUSTOMER GETS:                            │
│                                   • Live URL                                │
│                                   • GitHub repo                             │
│                                   • Stripe onboarding                       │
│                                   • Admin dashboard                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PROVISIONING PIPELINE (9 Steps, Sequential)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PROVISIONING PIPELINE                              │
│                    lib/services/provisioning-pipeline.ts              │
│                                                                      │
│  Input: projectId, projectName, userId, userEmail, codeFiles, SQL    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 1: CREATE SUPABASE PROJECT                             │     │
│  │ supabase-provisioning.ts → POST /v1/projects                │     │
│  │ Poll until ACTIVE_HEALTHY (~60s)                            │     │
│  │ Output: projectRef, projectUrl, databaseUrl, anonKey,       │     │
│  │         serviceRoleKey                                      │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 2: RUN DATABASE MIGRATIONS                             │     │
│  │ POST /v1/projects/{ref}/database/query                      │     │
│  │ Input: SQL extracted from app architecture prompt output     │     │
│  │ Skipped if no migration SQL found                           │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 3: CREATE STRIPE CONNECT ACCOUNT                       │     │
│  │ stripe-connect.ts → stripe.accounts.create({ type: express })│    │
│  │ + stripe.accountLinks.create() for onboarding URL           │     │
│  │ Output: accountId, onboardingUrl                            │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 4: PUSH CODE TO GITHUB                                 │     │
│  │ claude-codegen.ts → octokit.repos.createInOrg()             │     │
│  │ Org: GITHUB_ORG_NAME (fullstackvibecoder)                   │     │
│  │ Creates blobs, tree, commit, updates ref                    │     │
│  │ Output: repoUrl, repoName (org/repo)                        │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 5: CREATE VERCEL PROJECT + SET ENV VARS                │     │
│  │ vercel-provisioning.ts → POST /v10/projects                 │     │
│  │ Links to GitHub repo, sets framework to nextjs              │     │
│  │ Injects env vars:                                           │     │
│  │   DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL,                   │     │
│  │   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, │     │
│  │   NEXTAUTH_SECRET (generated), STRIPE_CONNECT_ACCOUNT_ID,   │     │
│  │   RESEND_API_KEY (if set)                                   │     │
│  │ Output: vercelProjectId, vercelProjectName                  │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 6: TRIGGER DEPLOYMENT + WAIT                           │     │
│  │ POST /v13/deployments → poll GET /v13/deployments/{id}      │     │
│  │ Wait for readyState === 'READY' (up to 300s)                │     │
│  │ Output: productionUrl                                       │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 7: VERIFY LIVE (HTTP 200)                              │     │
│  │ HEAD request to productionUrl, 3 retries, 5s between        │     │
│  │ Non-fatal if fails (app may still be initializing)          │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 8: SAVE DEPLOYED APP RECORD                            │     │
│  │ prisma.deployedApp.create() with ALL credentials            │     │
│  │ prisma.project.update() → status: COMPLETED                 │     │
│  │ Stores: supabase refs, vercel IDs, github URLs,             │     │
│  │         stripe connect ID + onboarding URL, provisioning log│     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Step 9: CREATE HOSTING SUBSCRIPTION                         │     │
│  │ Looks up stripeCustomerId from Payment record               │     │
│  │ stripe.subscriptions.create({ trial_period_days: 30 })      │     │
│  │ prisma.hostingSubscription.create()                         │     │
│  │ Non-fatal if fails (app is already live)                    │     │
│  │ Output: subscriptionId, trialEnd                            │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  On failure: saves partial state to DeployedApp, sets project FAILED │
│  Each step logs to DeployedApp.provisioningLog (JSON array)          │
│  Total expected time: 2-5 minutes                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. PAYMENT & SUBSCRIPTION FLOW

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PAYMENT FLOW                                  │
│                                                                      │
│  FREE PREVIEW (VALIDATION_PACK)                                      │
│  ───────────────────────────────                                     │
│  Browser → POST /api/create-checkout { tier: VALIDATION_PACK }       │
│         → Requires auth (getServerSession)                           │
│         → Creates Project (status: PENDING)                          │
│         → Fire-and-forget: POST /api/shipkit/execute                 │
│         → Returns { free: true, projectId, redirectUrl }             │
│         → Browser redirects to /dashboard                            │
│                                                                      │
│  PAID BUILD ($497, TURNKEY_SYSTEM)                                   │
│  ─────────────────────────────────                                   │
│  Browser → POST /api/create-checkout { tier: TURNKEY_SYSTEM }        │
│         → Creates Stripe Checkout Session ($497, one-time)           │
│         → Returns { url: stripe-checkout-url }                       │
│         → Browser redirects to Stripe                                │
│                                                                      │
│         Customer pays on Stripe                                      │
│              │                                                       │
│              ▼                                                       │
│  Stripe → POST /api/webhooks/stripe                                  │
│         → Event: checkout.session.completed                          │
│         → $transaction:                                              │
│           1. Find/create User (by email)                             │
│           2. Create Project (PENDING)                                │
│           3. Create Payment (COMPLETED)                              │
│         → POST /api/shipkit/execute (fire-and-forget)                │
│                                                                      │
│  HOSTING SUBSCRIPTION ($49/mo)                                       │
│  ─────────────────────────────                                       │
│  Created automatically by provisioning pipeline (Step 9)             │
│  30-day free trial included                                          │
│                                                                      │
│  Stripe → customer.subscription.updated → update HostingSubscription │
│  Stripe → invoice.payment_failed → set DeployedApp SUSPENDED        │
│  Stripe → invoice.paid → reactivate if SUSPENDED → ACTIVE           │
│  Stripe → customer.subscription.deleted → set CANCELLED             │
│                                                                      │
│  EJECT FLOW                                                          │
│  ──────────                                                          │
│  POST /api/project/[id]/eject                                        │
│    → Cancel Stripe subscription                                      │
│    → Set DeployedApp.hostingStatus = EJECTED                         │
│    → Return GitHub repo ZIP download URL                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE SCHEMA (Entity Relationship)

```
┌──────────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                                 │
│                      PostgreSQL (Supabase)                           │
│                                                                      │
│  ┌──────────┐     ┌───────────┐     ┌───────────────┐               │
│  │   User   │────<│  Account  │     │VerificationTkn│               │
│  │──────────│     │───────────│     │───────────────│               │
│  │ id (PK)  │────<│  Session  │     │ identifier    │               │
│  │ email    │     └───────────┘     │ token         │               │
│  │ name     │                       └───────────────┘               │
│  │ image    │                                                       │
│  └────┬─────┘                                                       │
│       │ userId                                                      │
│       ▼                                                             │
│  ┌──────────────────────┐          ┌────────────────────┐           │
│  │       Project        │          │      Payment       │           │
│  │──────────────────────│          │────────────────────│           │
│  │ id (PK, UUID)        │          │ id (PK, UUID)      │           │
│  │ userId (FK → User)   │          │ userId (FK → User) │           │
│  │ projectName          │◄─────────│ projectId (FK)     │           │
│  │ businessConcept      │          │ tier (BIABTier)     │           │
│  │ biabTier (enum)      │          │ amount (cents)      │           │
│  │ status (enum)        │          │ stripeSessionId     │           │
│  │ progress (0-100)     │          │ stripeCustomerId    │           │
│  │ totalPrompts         │          │ status (enum)       │           │
│  │ completedPrompts     │          │ completedAt         │           │
│  │ githubRepoUrl        │          └────────────────────┘           │
│  │ vercelDeploymentUrl  │                                           │
│  │ contextIds[]         │                                           │
│  └────┬────────┬────────┘                                           │
│       │        │                                                    │
│       │        │ 1:1                                                │
│       │        ▼                                                    │
│       │   ┌──────────────────────────┐    ┌───────────────────────┐ │
│       │   │      DeployedApp         │    │ HostingSubscription   │ │
│       │   │──────────────────────────│    │───────────────────────│ │
│       │   │ id (PK, UUID)            │    │ id (PK, UUID)         │ │
│       │   │ projectId (FK, unique)   │───>│ deployedAppId (FK)    │ │
│       │   │ supabaseProjectRef       │    │ stripeSubscriptionId  │ │
│       │   │ supabaseProjectUrl       │    │ stripeCustomerId      │ │
│       │   │ supabaseDatabaseUrl      │    │ status                │ │
│       │   │ supabaseAnonKey          │    │ currentPeriodEnd      │ │
│       │   │ supabaseServiceKey       │    └───────────────────────┘ │
│       │   │ vercelProjectId          │                              │
│       │   │ vercelProjectName        │                              │
│       │   │ vercelProductionUrl      │                              │
│       │   │ githubRepoFullName       │                              │
│       │   │ githubRepoUrl            │                              │
│       │   │ stripeConnectAccountId   │                              │
│       │   │ stripeConnectOnboarded   │                              │
│       │   │ stripeConnectOnboardingUrl│                             │
│       │   │ customDomain             │                              │
│       │   │ domainVerified           │                              │
│       │   │ resendDomainId           │                              │
│       │   │ hostingStatus (enum)     │                              │
│       │   │ provisioningLog (JSON)   │                              │
│       │   └──────────────────────────┘                              │
│       │                                                             │
│       │ projectId (no FK, string ref)                               │
│       ▼                                                             │
│  ┌─────────────────────────┐     ┌────────────────────┐             │
│  │   PromptExecution       │────>│  PromptTemplate    │             │
│  │─────────────────────────│     │────────────────────│             │
│  │ id (PK, serial)         │     │ id (PK, serial)    │             │
│  │ promptId (FK)           │     │ promptId (unique)   │             │
│  │ projectId (string)      │     │ promptName          │             │
│  │ input                   │     │ promptSection       │             │
│  │ output                  │     │ systemPrompt        │             │
│  │ tokensUsed              │     │ userPrompt          │             │
│  │ executionTimeMs         │     │ dependencies[]      │             │
│  │ status                  │     │ includedInTiers[]   │             │
│  └─────────────────────────┘     │ orderIndex          │             │
│                                  └────────────────────┘             │
│                                                                      │
│  ┌────────────────────┐     ┌────────────────────┐                  │
│  │  chat_submissions  │     │  DeliveryPackage   │                  │
│  │────────────────────│     │────────────────────│                  │
│  │ id (PK, serial)    │     │ id (PK, serial)    │                  │
│  │ session_id (unique)│     │ packageId (unique)  │                  │
│  │ name, email        │     │ projectId           │                  │
│  │ user_input         │     │ userId              │                  │
│  │ ai_recommendation  │     │ downloadUrl         │                  │
│  │ analysis_json      │     │ storagePath         │                  │
│  └────────────────────┘     │ expiresAt           │                  │
│                             └────────────────────┘                  │
│                                                                      │
│  ┌────────────────────┐     ┌────────────────────┐                  │
│  │   UserContext      │────<│  ContextChunk      │                  │
│  │────────────────────│     │────────────────────│                  │
│  │ id (PK, UUID)      │     │ id (PK, UUID)      │                  │
│  │ userId              │     │ contextId (FK)     │                  │
│  │ fileName            │     │ chunkIndex         │                  │
│  │ fileType (enum)     │     │ text               │                  │
│  │ storagePath         │     │ embedding (JSON)   │                  │
│  │ status (enum)       │     └────────────────────┘                  │
│  └────────────────────┘                                             │
│                                                                      │
│  ENUMS:                                                             │
│  BIABTier: VALIDATION_PACK | LAUNCH_BLUEPRINT | TURNKEY_SYSTEM      │
│  ProjectStatus: PENDING | IN_PROGRESS | PACKAGING | COMPLETED|FAILED│
│  PaymentStatus: PENDING | PROCESSING | COMPLETED | FAILED | REFUNDED│
│  HostingStatus: PROVISIONING | ACTIVE | SUSPENDED | CANCELLED|EJECT │
│  ContextFileType: PDF | TEXT | MARKDOWN | DOCX | URL | IMAGE        │
│  ContextStatus: PENDING | PROCESSING | COMPLETED | FAILED           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. API ROUTE MAP

```
┌──────────────────────────────────────────────────────────────────────┐
│                         API ROUTES (34)                              │
│                                                                      │
│  AUTH                                                                │
│  ────                                                                │
│  GET/POST /api/auth/[...nextauth]     NextAuth handler (Google OAuth)│
│                                                                      │
│  SHIPKIT CORE                                                        │
│  ────────────                                                        │
│  POST /api/shipkit/analyze            Claude business analysis       │
│                                       → saves chat_submissions       │
│                                       → returns sessionId            │
│                                                                      │
│  POST /api/shipkit/execute            Trigger orchestrator           │
│  GET  /api/shipkit/execute            Check execution status         │
│                                       → validates payment (skip free)│
│                                       → runs 8 prompts + codegen    │
│                                       → triggers provisioning        │
│                                                                      │
│  CHECKOUT & PAYMENT                                                  │
│  ──────────────────                                                  │
│  POST /api/create-checkout            Stripe checkout ($497)         │
│                                       or free preview (VALIDATION)   │
│                                       Auth required                  │
│                                                                      │
│  POST /api/webhooks/stripe            Stripe webhook (no auth)       │
│                                       Handles:                       │
│                                       • checkout.session.completed   │
│                                       • payment_intent.succeeded     │
│                                       • payment_intent.payment_failed│
│                                       • customer.subscription.updated│
│                                       • customer.subscription.deleted│
│                                       • invoice.payment_failed       │
│                                       • invoice.paid                 │
│                                                                      │
│  GET  /api/payment/verify             Verify Stripe session status   │
│  GET  /api/validate-promo             Validate promo code            │
│                                                                      │
│  PROJECT MANAGEMENT                                                  │
│  ──────────────────                                                  │
│  POST /api/project/[id]/domain        Add custom domain (Vercel)     │
│  GET  /api/project/[id]/domain        Check domain verification      │
│  GET  /api/project/[id]/hosting       Hosting status + logs + URLs   │
│  POST /api/project/[id]/redeploy      Trigger Vercel redeployment    │
│  POST /api/project/[id]/eject         Eject to self-hosted           │
│  GET  /api/project/[id]/stream        SSE progress stream            │
│  POST /api/project/[id]/orchestrate   Orchestration trigger          │
│  *    /api/project/[id]/tasks         Task management                │
│  *    /api/project/[id]/plan          Plan management                │
│  *    /api/project/[id]/package-delivery  Package delivery           │
│                                                                      │
│  DELIVERY                                                            │
│  ────────                                                            │
│  GET  /api/delivery/[packageId]/download   Download ZIP (signed URL) │
│  HEAD /api/delivery/[packageId]/download   Check availability        │
│                                                                      │
│  CONTEXT & RAG                                                       │
│  ────────────                                                        │
│  GET  /api/context                    List user's uploaded contexts   │
│  *    /api/context/[id]               Single context operations      │
│  *    /api/context/upload             Upload file for RAG            │
│                                                                      │
│  AI & VOICE                                                          │
│  ──────────                                                          │
│  POST /api/transcribe                 Whisper transcription (10MB)   │
│  POST /api/upload-voice               Upload voice to Supabase       │
│  *    /api/agent/execute              Agent execution                │
│                                                                      │
│  USER & LEADS                                                        │
│  ────────────                                                        │
│  POST /api/save-lead                  Save chat lead (rate-limited)  │
│  GET  /api/check-access               Check tool access              │
│  GET  /api/dashboard                  Dashboard data                 │
│                                                                      │
│  PROPOSALS & WORKFLOWS (legacy)                                      │
│  ──────────────────────────────                                      │
│  *    /api/proposal/[id]              Proposal CRUD                  │
│  *    /api/proposal/[id]/approve      Approve proposal               │
│  *    /api/proposal/[id]/revise       Revise proposal                │
│  *    /api/workflow/[id]/status       Workflow status                 │
│  *    /api/workflow/[id]/execute      Execute workflow                │
│                                                                      │
│  UTILITIES                                                           │
│  ─────────                                                           │
│  GET  /api/health                     DB latency + env check         │
│  POST /api/contact                    Contact form (rate-limited)    │
│  *    /api/storage/init               Initialize Supabase buckets    │
│                                                                      │
│  * = exists but minimal/placeholder implementation                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. PAGE ROUTE MAP

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PAGE ROUTES (26)                              │
│                                                                      │
│  MARKETING                           AUTH                            │
│  ─────────                           ────                            │
│  /                  Landing + Chat   /auth/signin     Google OAuth   │
│  /get-started       Pricing ($497)   /auth/error      Error page    │
│  /about             About page                                      │
│  /faq               FAQ                                              │
│  /what-is-vibe-coding  SEO page      LEGAL                          │
│  /launch-guide      Launch guide     ─────                          │
│  /contact           Contact form     /terms-of-service               │
│                                      /privacy-policy                 │
│  BLOG                                /cookie-policy                  │
│  ────                                                                │
│  /blog                    Listing                                    │
│  /blog/what-is-vibe-coding                                           │
│  /blog/myth-ai-will-replace-developers                               │
│  /blog/case-study-saas-mvp-3-days                                    │
│  /blog/ai-agency-course-scam                                         │
│  /blog/building-fullstack-vibe-coder-48-hours                        │
│                                                                      │
│  USER DASHBOARD (auth required)                                      │
│  ──────────────────────────────                                      │
│  /dashboard                          Project list + status           │
│  /dashboard/context                  Upload docs for RAG             │
│  /dashboard/project/[id]             Project detail + hosting mgmt   │
│                                                                      │
│  RESULTS & PAYMENT                                                   │
│  ─────────────────                                                   │
│  /shipkit/[projectId]/preview        Free tier preview               │
│  /payment/success                    Post-checkout callback          │
│  /success                            General success                 │
│  /client-access                      Client access portal            │
│  /proposal/[id]                      View proposal                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. EXTERNAL SERVICE INTEGRATION MAP

```
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   Anthropic       │    │   Stripe          │                      │
│  │   Claude API      │    │                   │                      │
│  │──────────────────│    │──────────────────│                       │
│  │ Model: claude-    │    │ Checkout Sessions │                      │
│  │  sonnet-4-5       │    │ Webhooks          │                      │
│  │                   │    │ Connect (Express)  │                      │
│  │ Used by:          │    │ Subscriptions     │                      │
│  │ • /api/shipkit/   │    │ Customers         │                      │
│  │   analyze         │    │                   │                      │
│  │ • Orchestrator    │    │ Keys:             │                      │
│  │   (8 prompts)     │    │ STRIPE_SECRET_KEY │                      │
│  │ • Code generation │    │ STRIPE_WEBHOOK_   │                      │
│  │ • Logo prompt     │    │  SECRET           │                      │
│  │                   │    │ STRIPE_HOSTING_   │                      │
│  │ Key:              │    │  PRICE_ID         │                      │
│  │ ANTHROPIC_API_KEY │    └──────────────────┘                      │
│  └──────────────────┘                                               │
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   Supabase        │    │   Vercel          │                      │
│  │──────────────────│    │──────────────────│                       │
│  │ Database (Prisma) │    │ ShipKit platform  │                      │
│  │ Storage (buckets) │    │  deployment       │                      │
│  │ Management API    │    │ Customer app      │                      │
│  │  (per-customer    │    │  deployment       │                      │
│  │   projects)       │    │ Env var injection  │                      │
│  │                   │    │ Custom domains    │                      │
│  │ Keys:             │    │                   │                      │
│  │ DATABASE_URL      │    │ Keys:             │                      │
│  │ SUPABASE_SERVICE_ │    │ VERCEL_TOKEN      │                      │
│  │  ROLE_KEY         │    │ VERCEL_TEAM_ID    │                      │
│  │ SUPABASE_MGMT_    │    └──────────────────┘                      │
│  │  API_KEY          │                                               │
│  │ SUPABASE_ORG_ID   │    ┌──────────────────┐                      │
│  └──────────────────┘    │   GitHub          │                      │
│                           │──────────────────│                       │
│  ┌──────────────────┐    │ Octokit REST API  │                      │
│  │   OpenAI          │    │ Repo creation     │                      │
│  │──────────────────│    │  (in org)         │                      │
│  │ Whisper API       │    │ File push (blobs, │                      │
│  │ (transcription    │    │  trees, commits)  │                      │
│  │  only)            │    │                   │                      │
│  │                   │    │ Keys:             │                      │
│  │ Key:              │    │ GITHUB_TOKEN /    │                      │
│  │ OPENAI_API_KEY    │    │  GITHUB_PAT       │                      │
│  └──────────────────┘    │ GITHUB_ORG_NAME   │                      │
│                           └──────────────────┘                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   SendGrid        │    │   Resend          │                      │
│  │──────────────────│    │──────────────────│                       │
│  │ Transactional     │    │ Email domain      │                      │
│  │ email (project    │    │ provisioning for  │                      │
│  │ started/done)     │    │ customer apps     │                      │
│  │                   │    │                   │                      │
│  │ Key:              │    │ Key:              │                      │
│  │ SENDGRID_API_KEY  │    │ RESEND_API_KEY    │                      │
│  └──────────────────┘    └──────────────────┘                      │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │   Dumpling AI     │                                               │
│  │──────────────────│                                               │
│  │ Logo generation   │                                               │
│  │ (5 variations per │                                               │
│  │  brand identity)  │                                               │
│  │                   │                                               │
│  │ Key:              │                                               │
│  │ DUMPLING_API      │                                               │
│  └──────────────────┘                                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. ORCHESTRATOR: 8-PROMPT EXECUTION

```
┌──────────────────────────────────────────────────────────────────────┐
│              SHIPKIT ORCHESTRATOR — PROMPT PIPELINE                  │
│              lib/agents/shipkit-orchestrator.ts                      │
│                                                                      │
│  Input: projectId, businessConcept, userId, tier, contextIds?        │
│  Model: claude-sonnet-4-5-20250514 (temp 0.7, max 4096 tokens)      │
│                                                                      │
│  LITE (VALIDATION_PACK) — Free, 2 prompts                           │
│  ┌───────────────────────────────────────┐                          │
│  │ 1. sk_business_brief_01              │  Business brief, names,   │
│  │    Dependencies: none                │  value prop, audience     │
│  ├───────────────────────────────────────┤                          │
│  │ 2. sk_preview_mockup_02             │  Site preview mockup      │
│  │    Dependencies: sk_business_brief_01│                           │
│  └───────────────────────────────────────┘                          │
│                                                                      │
│  PRO (LAUNCH_BLUEPRINT) — $197 (legacy), 6 prompts                  │
│  ┌───────────────────────────────────────┐                          │
│  │ 3. sk_brand_identity_03             │  Brand guidelines, colors  │
│  │    Dependencies: sk_business_brief_01│  + triggers logo gen      │
│  │    → Dumpling AI: 5 logo variations  │  (Dumpling API)           │
│  ├───────────────────────────────────────┤                          │
│  │ 4. sk_marketing_strategy_04         │  Launch plan, channels     │
│  │    Dependencies: brief, brand        │                           │
│  ├───────────────────────────────────────┤                          │
│  │ 5. sk_financial_projections_05      │  Revenue model, costs      │
│  │    Dependencies: brief, marketing    │                           │
│  ├───────────────────────────────────────┤                          │
│  │ 6. sk_business_plan_06             │  Complete business plan     │
│  │    Dependencies: all above           │                           │
│  └───────────────────────────────────────┘                          │
│                                                                      │
│  COMPLETE (TURNKEY_SYSTEM) — $497, all 8 prompts                    │
│  ┌───────────────────────────────────────┐                          │
│  │ 7. sk_app_architecture_07           │  DB schema, API design,   │
│  │    Dependencies: brief, brand, plan  │  auth flows, SQL          │
│  ├───────────────────────────────────────┤                          │
│  │ 8. sk_nextjs_codebase_08           │  Full Next.js codebase     │
│  │    Dependencies: all above           │  (Map<filepath, content>) │
│  └───────────────────────────────────────┘                          │
│                                                                      │
│  After prompts complete (TURNKEY_SYSTEM only):                       │
│  ┌───────────────────────────────────────┐                          │
│  │ generateCodebase()                   │  Parse files from prompt  │
│  │ claude-codegen.ts                    │  #8 output, scaffold if   │
│  │                                      │  parsing fails            │
│  ├───────────────────────────────────────┤                          │
│  │ provisionInfrastructure()            │  Full 9-step pipeline     │
│  │ provisioning-pipeline.ts             │  (see diagram #2)         │
│  └───────────────────────────────────────┘                          │
│                                                                      │
│  Progress: emitted via callback at each prompt start/complete/fail   │
│  RAG: if contextIds provided, loads UserContext chunks into prompts  │
│  Errors: non-fatal per prompt (continues to next), logged to DB     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. FILE TREE (Key Files Only)

```
fullstack-vibe-coder-final/
├── prisma/
│   ├── schema.prisma                    # 15 models, 6 enums
│   └── seed-shipkit-prompts.ts          # 8 prompt template seeds
│
├── app/
│   ├── layout.tsx                       # Root layout (SessionProvider)
│   ├── page.tsx                         # Landing page + ChatInterface
│   ├── get-started/page.tsx             # Pricing ($497 single card)
│   │
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── error/page.tsx
│   │
│   ├── dashboard/
│   │   ├── page.tsx                     # Project list (server)
│   │   ├── context/page.tsx             # RAG uploads
│   │   └── project/[id]/
│   │       ├── page.tsx                 # Detail + hosting management
│   │       └── ProjectDetailClient.tsx  # Real-time polling
│   │
│   ├── shipkit/[projectId]/
│   │   └── preview/page.tsx             # Free tier preview
│   │
│   ├── payment/success/page.tsx         # Post-checkout
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── shipkit/
│       │   ├── analyze/route.ts         # Claude business analysis
│       │   └── execute/route.ts         # Orchestrator trigger
│       ├── create-checkout/route.ts     # Stripe checkout
│       ├── webhooks/stripe/route.ts     # Stripe webhook (7 events)
│       ├── payment/verify/route.ts
│       ├── project/[id]/
│       │   ├── domain/route.ts          # Custom domain CRUD
│       │   ├── hosting/route.ts         # Hosting status
│       │   ├── redeploy/route.ts        # Trigger redeploy
│       │   └── eject/route.ts           # Eject to self-host
│       ├── delivery/[packageId]/
│       │   └── download/route.ts        # ZIP download
│       ├── context/
│       │   ├── route.ts                 # List contexts
│       │   ├── [id]/route.ts
│       │   └── upload/route.ts          # File upload
│       ├── transcribe/route.ts          # Whisper
│       ├── upload-voice/route.ts        # Voice → Supabase
│       ├── save-lead/route.ts
│       ├── health/route.ts
│       └── contact/route.ts
│
├── lib/
│   ├── db.ts                            # Prisma singleton
│   ├── auth.ts                          # NextAuth config
│   ├── stripe.ts                        # Stripe client (test/live)
│   ├── storage.ts                       # Supabase storage
│   ├── rate-limit.ts
│   │
│   ├── agents/
│   │   └── shipkit-orchestrator.ts      # 8-prompt pipeline + codegen
│   │
│   ├── services/
│   │   ├── provisioning-pipeline.ts     # 9-step infra deployment
│   │   ├── supabase-provisioning.ts     # Supabase Management API
│   │   ├── vercel-provisioning.ts       # Vercel REST API
│   │   ├── stripe-connect.ts            # Stripe Connect Express
│   │   ├── resend-provisioning.ts       # Email domain setup
│   │   ├── claude-codegen.ts            # Code gen + GitHub push
│   │   ├── eject-service.ts             # Self-host migration
│   │   ├── rag-service.ts              # RAG retrieval
│   │   ├── embedding-service.ts         # Text embeddings
│   │   ├── text-extraction-service.ts   # PDF/DOCX extraction
│   │   ├── dumpling-client.ts           # Logo generation
│   │   └── deployment-handoff.ts        # Handoff docs
│   │
│   ├── delivery/
│   │   ├── package-biab-deliverables.ts # ZIP packaging
│   │   ├── organize-deliverables.ts     # File organization
│   │   └── convert-to-pdf.ts            # MD → PDF
│   │
│   └── email/
│       └── postmark-client.ts           # SendGrid emails
│
├── components/
│   ├── ShipKitReady.tsx                 # Celebration banner
│   ├── ChatInterface.tsx                # Landing page chat
│   ├── StatusBadge.tsx                  # Status indicators
│   └── ...
│
├── docs/
│   └── ARCHITECTURE.md                  # ← THIS FILE
│
├── .env                                 # Environment variables
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 10. ENVIRONMENT VARIABLES — COMPLETE REFERENCE

```
┌──────────────────────────────────────────────────────────────────────┐
│                  ENVIRONMENT VARIABLES (ALL)                         │
│                                                                      │
│  DATABASE                                                            │
│  ────────                                                            │
│  DATABASE_URL                  PostgreSQL (Supabase pooler)          │
│                                                                      │
│  SUPABASE                                                            │
│  ────────                                                            │
│  NEXT_PUBLIC_SUPABASE_URL      Project URL (client-side)             │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY Anon key (client-side)                │
│  SUPABASE_SERVICE_ROLE_KEY     Service role (server, bypasses RLS)   │
│  SUPABASE_MANAGEMENT_API_KEY   Management API (create projects)      │
│  SUPABASE_ORGANIZATION_ID      Org for new customer projects         │
│                                                                      │
│  AUTH                                                                │
│  ────                                                                │
│  NEXTAUTH_SECRET / AUTH_SECRET Session encryption                    │
│  NEXTAUTH_URL                  Auth callback (fullstackvibecoder.com)│
│  GOOGLE_CLIENT_ID              Google OAuth                          │
│  GOOGLE_CLIENT_SECRET          Google OAuth                          │
│                                                                      │
│  STRIPE                                                              │
│  ──────                                                              │
│  STRIPE_SECRET_KEY             Live secret key                       │
│  STRIPE_SECRET_TEST_KEY        Test key (dev fallback)               │
│  STRIPE_WEBHOOK_SECRET         Live webhook secret                   │
│  STRIPE_WEBHOOK_SECRET_TEST    Test webhook secret (dev fallback)    │
│  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  Public key                      │
│  STRIPE_PUBLISHABLE_TEST_KEY   Test public key (dev fallback)        │
│  STRIPE_HOSTING_PRICE_ID       $49/mo hosting product price          │
│                                                                      │
│  AI SERVICES                                                         │
│  ───────────                                                         │
│  ANTHROPIC_API_KEY             Claude SDK                            │
│  OPENAI_API_KEY                Whisper transcription                  │
│                                                                      │
│  GITHUB & DEPLOYMENT                                                 │
│  ───────────────────                                                 │
│  GITHUB_TOKEN / GITHUB_PAT    GitHub API (repo creation + push)      │
│  GITHUB_ORG_NAME               Org for customer repos                │
│  VERCEL_TOKEN                  Vercel API (deployment)               │
│  VERCEL_TEAM_ID                Vercel team for customer projects      │
│                                                                      │
│  EMAIL                                                               │
│  ─────                                                               │
│  SENDGRID_API_KEY              Transactional email                   │
│  RESEND_API_KEY                Email domain provisioning             │
│  DUMPLING_API                  Logo generation                       │
│                                                                      │
│  APP CONFIG                                                          │
│  ──────────                                                          │
│  NEXT_PUBLIC_BASE_URL          Public URL (fullstackvibecoder.com)    │
│  NODE_ENV                      development / production              │
└──────────────────────────────────────────────────────────────────────┘
```

---

*End of architecture reference. Print on A3/Tabloid for wall display.*

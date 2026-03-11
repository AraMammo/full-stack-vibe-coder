# ShipKit Build Spec
## Claude Code Execution Document — fullstackvibecoder.com

This document is the authoritative instruction set for building the next phase of ShipKit.
Execute each phase in order. Do not skip ahead. Verify each phase before proceeding.

---

## Context

ShipKit is a provisioning factory at fullstackvibecoder.com. The existing pipeline is complete
and production-ready for the $497 Builder product (SaaS codebase, Supabase, Stripe Connect,
GitHub, Vercel). This build adds a second product line, a visual intake layer, and an
iteration loop on top of the same infrastructure.

Do not touch the existing provisioning pipeline unless a task explicitly targets it.

---

## Current Stack

- **Framework:** Next.js 14 (App Router)
- **ORM:** Prisma
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe (Connect + Subscriptions)
- **Deploy:** Vercel
- **AI:** Claude API (prompt_templates table in DB)
- **Logo Gen:** Dumpling AI
- **Styling:** Tailwind CSS v3 + shadcn/ui

---

## Phase 1 — Static Site Prompt Engine

### Goal
Create `sk_landing_deploy_01`: a new prompt template that generates a complete static
Next.js site export. No database. No auth. No Stripe. Formspree contact form. Email capture.

### Tasks

1. **Add prompt to DB**
   - Insert new row into `prompt_templates` table:
     - `key`: `sk_landing_deploy_01`
     - `version`: `01`
     - `description`: Static landing page generator for service businesses
     - `variables`: `{{business_name}}`, `{{value_prop}}`, `{{target_audience}}`,
       `{{primary_color}}`, `{{accent_color}}`, `{{font_pair}}`, `{{visual_dna}}`
       (visual_dna optional, gracefully skipped if null)
   - Prompt instruction: Generate a complete static Next.js export. Pages: `/`, `/about`,
     `/services`, `/contact`. Tailwind CSS v3 only. No DB, no auth, no Stripe.
     Contact form via Formspree (`NEXT_PUBLIC_FORMSPREE_ID` env var). Email capture
     POST to `/api/subscribe` stub. Output as full file tree with contents.

2. **Create static deploy path**
   - New file: `lib/provisioning/staticDeploy.ts`
   - Function: `deployStaticSite(projectId: string)`
   - Steps:
     1. Pull generated code from project record
     2. Create GitHub repo under org (reuse existing GitHub util)
     3. Push generated files
     4. Create Vercel project linked to repo
     5. Set env vars: `NEXT_PUBLIC_FORMSPREE_ID`, `NEXT_PUBLIC_SITE_NAME`
     6. Trigger deploy
     7. Poll until HTTP 200
     8. Return live URL
   - This is a simplified fork of the existing provisioning pipeline.
     Do not merge them. Keep separate.

3. **Add product type flag**
   - Add `product_type` enum to `projects` table: `BUILDER` | `PRESENCE`
   - Default existing records to `BUILDER`
   - Route `/api/shipkit/execute` to correct pipeline based on `product_type`

4. **Create ShipKit Presence checkout**
   - New Stripe price: $97 (Presence - Static Site)
   - New route: `/api/checkout/presence`
   - Webhook handler: same pattern as Builder, sets `product_type: PRESENCE`

### Verification
- [ ] `sk_landing_deploy_01` prompt exists in DB and returns valid file tree
- [ ] Static deploy path creates a live Vercel URL with no DB/auth dependencies
- [ ] Presence checkout triggers correct pipeline
- [ ] Builder pipeline unchanged and still passing

---

## Phase 2 — Visual DNA Intake

### Goal
Accept screenshot uploads. Extract visual direction. Inject into brand identity prompt
as a structured `{{visual_dna}}` block.

### Tasks

1. **Add `{{visual_dna}}` to `sk_brand_identity_03`**
   - Update existing prompt template in DB
   - Append to variable list: `{{visual_dna}}`
   - Instruction: "If visual_dna is provided, use it as the primary signal for color,
     layout, and typography decisions. Override your own defaults where signals are present."
   - visual_dna block format:
     ```
     COLOR SIGNALS: [dominant hex values, contrast style]
     LAYOUT SIGNALS: [density, nav pattern, hero pattern]
     TYPOGRAPHY SIGNALS: [heading weight, body style]
     COMPONENT PATTERNS: [card style, button style, imagery]
     ```

2. **Build Vision API integration**
   - New file: `lib/intake/visionAnalysis.ts`
   - Function: `extractVisualDNA(imageBuffer: Buffer): Promise<VisualDNABlock>`
   - Use Google Cloud Vision API:
     - `IMAGE_ANNOTATE` with features: `IMAGE_PROPERTIES`, `LABEL_DETECTION`
   - After Vision API call, pass raw output to Claude with prompt:
     "Analyze these visual properties and return a structured Visual DNA block.
      Return only the block, no explanation."
   - Return typed `VisualDNABlock` object
   - Env vars required: `GOOGLE_CLOUD_VISION_API_KEY`

3. **Add screenshot upload to intake form**
   - Update intake UI (chat or form component, wherever intake currently lives)
   - Add optional file upload field: accepts `image/png`, `image/jpeg`, `image/webp`
   - Max file size: 5MB
   - On submit: upload to Supabase Storage bucket `intake-screenshots`
   - Pass Storage URL into project record as `reference_screenshot_url`
   - Before orchestrator runs: if URL exists, call `extractVisualDNA`, store result
     as `visual_dna` on project record, inject into `sk_brand_identity_03` variables

4. **Graceful fallback**
   - If no screenshot uploaded: `visual_dna` is null
   - Prompt handles null gracefully — do not inject empty block

### Verification
- [ ] Upload a screenshot → Visual DNA block is generated and stored on project record
- [ ] `sk_brand_identity_03` receives `visual_dna` when present
- [ ] Brand output visually reflects screenshot signals
- [ ] No screenshot → pipeline runs as before, no errors

---

## Phase 3 — Iteration Loop

### Goal
Let users request changes after delivery without buying again. One plain-language
message triggers a targeted file regeneration and redeploy. This is what justifies
the $49/mo hosting subscription.

### Tasks

1. **Create change request data model**
   - New table: `change_requests`
     - `id`, `project_id`, `user_message`, `status` (PENDING | PROCESSING | COMPLETE | FAILED),
       `affected_files`, `diff_summary`, `created_at`, `completed_at`

2. **Build change request handler**
   - New file: `lib/iteration/changeHandler.ts`
   - Function: `processChangeRequest(projectId: string, userMessage: string)`
   - Steps:
     1. Call Claude with current project context + user message
        Prompt: "Given this project's current file tree and the user's change request,
        identify which files need to change and output only those files regenerated.
        Format: JSON array of `{filename, content}` objects."
     2. Parse response → array of file changes
     3. Pull current GitHub repo
     4. Apply file changes via GitHub API (commit directly to main)
     5. Vercel auto-deploys on push
     6. Poll for new deploy HTTP 200
     7. Update `change_requests` record as COMPLETE
     8. Return new deploy URL

3. **Expose change request endpoint**
   - New route: `POST /api/projects/[id]/change`
   - Auth: project owner only (match `user_id` on project)
   - Body: `{ message: string }`
   - Returns: `{ status, deployUrl, diff_summary }`

4. **Add change request UI to customer dashboard**
   - Add text input: "Request a change"
   - Show history of past requests with status badges
   - On complete: show updated live URL

5. **Gate behind active subscription**
   - Only allow change requests if project has active `$49/mo` Stripe subscription
   - Return 402 if subscription is inactive or cancelled

### Verification
- [ ] "Make the background darker" → correct file regenerated → redeploy → new URL returned
- [ ] Change request history visible in dashboard
- [ ] Inactive subscription → 402 response, no changes processed
- [ ] Change does not wipe unaffected files

---

## Phase 4 — OpenClaw Messaging Intake (Telegram)

### Goal
Expose the full ShipKit Presence pipeline via Telegram. User sends a message +
optional screenshots. Gets a live URL back. Never opens a browser.

### Tasks

1. **Set up Telegram bot**
   - Create bot via BotFather
   - Store token as `TELEGRAM_BOT_TOKEN` env var
   - New file: `lib/openclaw/telegramBot.ts`

2. **Build state machine**
   - States: `AWAITING_SCREENSHOTS` → `AWAITING_DESCRIPTION` → `GENERATING` → `LIVE` → `ITERATING`
   - Persist state per `chat_id` in new table: `openclaw_sessions`
     - `chat_id`, `state`, `project_id`, `screenshots` (json array of URLs), `created_at`

3. **Webhook handler**
   - New route: `POST /api/openclaw/telegram`
   - Register as Telegram webhook on deploy
   - Handle message types: text, photo, document
   - State transitions:
     - Any message → if no active session → create session, set `AWAITING_SCREENSHOTS`,
       reply: "Send me screenshots of sites you like, or type 'skip' to continue."
     - Photo/document received in `AWAITING_SCREENSHOTS` → store to Supabase Storage,
       append URL to session screenshots, reply: "Got it. Send more or type 'done'."
     - 'done' or 'skip' in `AWAITING_SCREENSHOTS` → set `AWAITING_DESCRIPTION`,
       reply: "Describe your business in one message. What do you do and who do you serve?"
     - Text in `AWAITING_DESCRIPTION` → set `GENERATING`, create project record,
       run full Presence pipeline async, reply: "Building now. I'll send your URL when it's live."
     - Pipeline complete → set `LIVE`, reply: "Your site is live: [URL]\n\nTo request changes,
       reply with what you want updated."
     - Text in `LIVE` → set `ITERATING`, run change request handler, reply with new URL when done

4. **User identity**
   - On first message: create or find user record by `telegram_chat_id`
   - Link to Stripe customer for subscription management
   - Presence pipeline requires active $97 payment — send Stripe payment link if no purchase

### Verification
- [ ] Full flow from Telegram message → live URL without browser
- [ ] Screenshots processed through Visual DNA → reflected in output
- [ ] Change request via reply works end to end
- [ ] No active payment → Stripe payment link sent before pipeline runs

---

## Environment Variables Required (Full List)

```bash
# Existing
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
DUMPLING_API_KEY=
GITHUB_ORG=
GITHUB_TOKEN=
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# New — Phase 1
STRIPE_PRESENCE_PRICE_ID=
NEXT_PUBLIC_FORMSPREE_ID=

# New — Phase 2
GOOGLE_CLOUD_VISION_API_KEY=

# New — Phase 4
TELEGRAM_BOT_TOKEN=
```

---

## Build Order

| Phase | Dependency | Estimated Scope |
|---|---|---|
| Phase 1 — Static Site Engine | None | Core new product |
| Phase 2 — Visual DNA | Phase 1 complete | High leverage, one prompt edit + new lib |
| Phase 3 — Iteration Loop | Phase 1 complete | Required to justify $49/mo |
| Phase 4 — Telegram (OpenClaw) | Phase 1 + 2 complete | Volume acquisition layer |

---

## What Not to Touch

- Existing `sk_business_brief_01` through `sk_nextjs_codebase_08` prompts
- Existing Builder provisioning pipeline (`/api/shipkit/execute` Builder path)
- Existing Stripe Builder pricing
- Existing GitHub/Vercel provisioning utilities (extend, don't replace)

---

## Definition of Done

Each phase is done when:
1. All verification checkboxes pass
2. No TypeScript errors (`tsc --noEmit`)
3. No broken existing Builder flow
4. New env vars documented in `.env.example`
5. New DB changes have a Prisma migration file committed

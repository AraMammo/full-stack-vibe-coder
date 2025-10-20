# FullStackVibeCoder - AI-Powered Development Agency Platform

## Overview

FullStackVibeCoder is an AI-driven development agency platform that transforms voice notes into complete business solutions. The system uses a multi-agent AI orchestration architecture to analyze client requirements, generate proposals, and execute development tasks autonomously.

**Core Value Proposition:**
- "Business In A Box" - Complete startup kit ($297, 48-hour delivery)
- Enterprise automation projects ($20K-$250K)
- AI agents handle everything from requirements gathering to code generation

**Key Workflow:**
1. Client uploads voice note describing their business idea
2. AI agents transcribe, analyze, and generate a detailed proposal
3. Client reviews and approves proposal
4. Orchestrator agent breaks down project into executable tasks
5. Specialist agents (Frontend, Backend, Design, Content) generate deliverables
6. Complete solution delivered to client

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### 1. Multi-Agent AI System

**Agent Hierarchy:**
- **Intake Agent** - Analyzes voice transcripts, extracts business requirements
- **Scope Agent** - Defines project deliverables and technical specifications
- **Estimator Agent** - Calculates costs and timelines based on complexity
- **Proposal Agent** - Generates client-facing proposal documents
- **Orchestrator Agent** - Decomposes approved proposals into atomic tasks with dependencies
- **Specialist Agents** - Execute specific task types:
  - Frontend Agent: React/Next.js components with TypeScript + Tailwind
  - Backend Agent: API routes, database operations (TODO)
  - Design Agent: Brand guidelines, UI/UX specs (TODO)
  - Content Agent: Copywriting, documentation (TODO)

**Design Pattern:** Sequential workflow with state management. Each agent receives context from previous agents and enriches the workflow state. Base classes (`BaseAgent`, `BaseSpecialistAgent`) provide common functionality for API calls, logging, and error handling.

**Technology Choice:** Anthropic Claude (via `@anthropic-ai/sdk`) selected for advanced reasoning capabilities. Uses Claude Sonnet 4.5 for most agents with varying temperature settings based on task requirements (lower for estimation/structure, higher for creative writing).

### 2. Authentication & Authorization

**Implementation:** NextAuth.js v5 with Prisma adapter

**Supported Methods:**
- Email magic links (primary)
- Google OAuth (optional)

**Session Management:**
- JWT-based sessions (30-day expiry)
- Server-side session helpers for route protection
- Database-backed session storage via Prisma

**Rationale:** Magic links reduce friction for users (no password management), while OAuth provides familiar sign-in option. JWT sessions enable stateless authentication while Prisma adapter maintains user data in PostgreSQL.

### 3. Data Architecture

**ORM:** Prisma (v6.17.1+)

**Core Data Models:**
- **Authentication**: User, Account, Session, VerificationToken
- **Payment Tracking**: Payment (Stripe integration)
- **Content**: VoiceNote (uploaded audio + transcription)
- **AI Workflow**: Workflow, WorkflowStep, AgentMessage
- **Proposals**: Proposal, ProposalApproval
- **Project Management**: Project, Task, TaskArtifact, Deliverable, ProjectUpdate
- **Configuration**: PricingBenchmark, SystemConfig

**Key Architectural Decisions:**
- Cascading deletes for data integrity (e.g., deleting a workflow removes all associated steps)
- Indexed fields for performance (userId, workflowId, projectId)
- JSON fields for flexible schema (e.g., agent inputs/outputs, proposal content)
- Separation of concerns: Workflow (AI processing) vs Project (actual execution)

### 4. File Storage

**Provider:** Supabase Storage

**Bucket Structure:**
- `voice-notes` - Client audio uploads
- `proposals` - Generated proposal documents
- `deliverables` - Completed project assets
- `branding-assets` - Logos, brand guidelines, design files

**Implementation Details:**
- Server-side operations use service role key (bypasses RLS)
- 50MB file size limit per bucket
- Private buckets by default (authenticated access only)
- Singleton Supabase client pattern to prevent connection pooling issues

**Rationale:** Supabase provides scalable object storage with built-in CDN, authentication integration, and generous free tier. Alternative considered: AWS S3 (more complex setup, higher operational overhead).

### 5. Payment Processing

**Provider:** Stripe

**Implementation:**
- Checkout Sessions for payment collection
- Success redirect to `/upload` with session ID
- Payment verification before workflow execution
- Database tracking via Payment model

**Flow:**
1. User clicks "Start Your Business Now" on pricing page
2. Stripe Checkout Session created via `/api/create-checkout`
3. User completes payment on Stripe-hosted page
4. Redirect to `/upload?session_id={CHECKOUT_SESSION_ID}`
5. Voice note upload requires valid payment verification

### 6. Frontend Architecture

**Framework:** Next.js 14 with App Router

**Rendering Strategy:**
- Server Components by default (better performance, SEO)
- Client Components for interactivity (`'use client'` directive)
- Dynamic routes for proposals and projects (`/proposal/[id]`)

**Styling Approach:**
- Global CSS with cyberpunk/maximalist aesthetic
- Custom animations (particle effects, glitch text, floating elements)
- Responsive design (mobile-first)
- CSS variables for theming (neon colors: `#ff0080`, `#00ff88`, `#00aaff`)

**UI Components:**
- StatusBadge - Workflow/proposal status indicators with color coding
- ProposalActions - Client-side approval/revision interface
- Navigation - Global nav with contact form integration

**Design Philosophy:** "Chaotic cyberpunk" aesthetic with professional functionality. High contrast, animated backgrounds, while maintaining WCAG accessibility standards.

### 7. API Architecture

**Pattern:** Next.js Route Handlers (App Router)

**Key Endpoints:**
- `/api/upload-voice` - Voice note upload + transcription
- `/api/workflow/[id]/execute` - Trigger AI agent workflow
- `/api/workflow/[id]/status` - Poll workflow progress
- `/api/proposal/[id]/approve` - Approve proposal, create project
- `/api/proposal/[id]/revise` - Request proposal changes
- `/api/project/[id]/orchestrate` - Break project into tasks
- `/api/agent/execute` - Execute specialist agent task
- `/api/dashboard` - Fetch user's workflows and proposals

**Common Patterns:**
- Session validation on all protected routes
- Ownership verification (user can only access their own data)
- Structured error responses with HTTP status codes
- TypeScript interfaces for request/response types

### 8. Task Orchestration

**Execution Model:**
1. Orchestrator analyzes proposal deliverables
2. Breaks into atomic tasks (2-8 hours each)
3. Assigns to specialist agents
4. Creates dependency graph (tasks that block other tasks)
5. Tasks organized by phases: design → build → test → launch
6. Priority levels (1=critical, 5=nice-to-have)

**Dependency Resolution:**
- Tasks marked with `dependsOn` array (IDs of blocking tasks)
- Tasks only ready when all dependencies completed
- Tasks flagged as `requiresHumanReview` for complex decisions

**Current Status:** Orchestrator working, Frontend Agent functional, other agents planned.

## External Dependencies

### Required Services

1. **Anthropic Claude API**
   - Purpose: AI agent reasoning and code generation
   - Model: `claude-sonnet-4.5-20250929`
   - Environment variable: `ANTHROPIC_API_KEY`

2. **OpenAI API**
   - Purpose: Whisper audio transcription
   - Environment variable: `OPENAI_API_KEY`
   - Status: Already configured

3. **Supabase**
   - Purpose: PostgreSQL database + file storage
   - Environment variables:
     - `DATABASE_URL` - PostgreSQL connection string
     - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
     - `SUPABASE_SERVICE_ROLE_KEY` - Admin API key

4. **Stripe**
   - Purpose: Payment processing
   - Environment variables:
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - `STRIPE_SECRET_KEY`
   - Status: Already configured

5. **Email Service** (for magic links)
   - Environment variables:
     - `EMAIL_SERVER_HOST`
     - `EMAIL_SERVER_PORT`
     - `EMAIL_SERVER_USER`
     - `EMAIL_SERVER_PASSWORD`
     - `EMAIL_FROM`

### NPM Packages

**Core Dependencies:**
- `next@14.0.0` - React framework with App Router
- `react@18.2.0` + `react-dom@18.2.0` - UI library
- `typescript@5.0.0` - Type safety
- `@prisma/client@6.17.1` + `prisma@6.17.1` - Database ORM
- `@anthropic-ai/sdk@0.67.0` - Claude AI integration
- `openai@4.20.0` - Whisper transcription
- `next-auth@5.0.0-beta.29` - Authentication
- `@auth/prisma-adapter@2.11.0` - NextAuth + Prisma integration
- `@supabase/supabase-js@2.76.0` - Supabase client
- `stripe@19.1.0` + `@stripe/stripe-js@8.0.0` - Payment processing
- `zod@4.1.12` - Schema validation

**LangChain (Optional/Experimental):**
- `@langchain/anthropic@1.0.0`
- `@langchain/core@1.0.1`
- `@langchain/langgraph@1.0.0`

**Note:** Application does not currently use LangChain in production code. Direct Anthropic SDK preferred for simpler implementation and better control.

### Deployment Requirements

- **Node.js**: 18+
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Replit (recommended) or Vercel
- **Environment**: Production requires all environment variables configured
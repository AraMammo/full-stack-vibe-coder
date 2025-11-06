# FullStackVibeCoder - AI-Powered Development Agency Platform

## Overview

FullStackVibeCoder is an AI-driven development agency platform that transforms voice notes into complete business solutions. It uses a multi-agent AI orchestration architecture to analyze client requirements, generate proposals, and execute development tasks autonomously. The platform offers "Business In A Box" solutions and enterprise automation projects, aiming to provide a complete startup kit or extensive AI-driven project development. It also includes a "Tools Marketplace" offering pre-built AI-powered SaaS products (currently marked as "coming soon").

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Agent AI System

The platform utilizes a hierarchical multi-agent AI system. Key agents include the Intake Agent (voice transcript analysis), Scope Agent (deliverables & technical specs), Estimator Agent (cost & timeline calculation), Proposal Agent (client proposals), and Orchestrator Agent (task decomposition). Specialist Agents (Frontend, Backend, Design, Content) execute specific development tasks. The system uses Anthropic Claude (Sonnet 4.5) for reasoning, with sequential workflow and state management.

### Authentication & Authorization

NextAuth.js v5 with a Prisma adapter handles authentication, supporting email magic links and Google OAuth. It uses JWT-based sessions and server-side session helpers, with session data stored in PostgreSQL via Prisma.

### Data Architecture

The core platform uses Prisma (v6.17.1+) as an ORM with PostgreSQL. Key models cover authentication, payment tracking (Stripe), voice notes, AI workflow, proposals, project management, and configuration. A dual-database strategy is employed, with Drizzle ORM managing the "Tools Marketplace" data.

### File Storage

Supabase Storage is used for file management, with dedicated buckets for voice notes, proposals, deliverables, and branding assets. It operates with server-side service role keys for secure access.

### Payment Processing

Stripe is integrated for payment processing, utilizing Checkout Sessions for secure collection and payment verification before initiating AI workflows.

### Frontend Architecture

Built with Next.js 14 and the App Router, the frontend primarily uses Server Components with Client Components for interactivity. Styling adheres to a "chaotic cyberpunk" aesthetic using global CSS, custom animations, and neon color schemes, ensuring responsiveness and WCAG accessibility standards.

### API Architecture

Next.js Route Handlers manage API endpoints for voice note upload, AI workflow execution, proposal management, project orchestration, and dashboard data. All protected routes include session and ownership validation.

### Task Orchestration

The Orchestrator agent breaks down approved proposals into atomic, dependency-managed tasks (2-8 hours each) assigned to specialist agents. Tasks are organized into phases (design, build, test, launch) with priority levels, and can be flagged for human review.

### AI Chat Interface

An AI chat interface on the homepage allows for text and voice input (OpenAI Whisper), providing AI-powered product recommendations (GPT-4o-mini). It intelligently routes users to branding, tools, or automation services, deferring email collection until a user shows genuine interest by clicking a call-to-action.

## External Dependencies

### Required Services

1.  **Anthropic Claude API**: AI agent reasoning and code generation (`claude-sonnet-4.5-20250929`).
2.  **OpenAI API**: Whisper audio transcription and GPT recommendations.
3.  **Supabase**: PostgreSQL database and file storage.
4.  **Stripe**: Payment processing.
5.  **Email Service**: For magic link authentication.
6.  **Airtable**: For managing tool marketplace services and leads.

### NPM Packages

*   `next`, `react`, `react-dom`, `typescript`
*   `@prisma/client`, `prisma`, `@auth/prisma-adapter`
*   `@anthropic-ai/sdk`, `openai`
*   `next-auth`
*   `@supabase/supabase-js`
*   `stripe`, `@stripe/stripe-js`
*   `zod`
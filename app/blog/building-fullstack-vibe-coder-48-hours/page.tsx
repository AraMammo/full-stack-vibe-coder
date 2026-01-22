import { Metadata } from 'next';
import { BlogPostLayout, BlogSection, BlogHighlight, BlogQuote } from '@/components/BlogPostLayout';

export const metadata: Metadata = {
  title: "I Built This Entire Platform in 48 Hours | FullStackVibeCoder Blog",
  description: "The complete build log of FullStackVibeCoder.com. What worked, what broke, and how AI did 90% of the heavy lifting.",
  keywords: "building in public, AI development, vibe coding, 48 hour build",
  openGraph: {
    title: "I Built This Entire Platform in 48 Hours (Here's How)",
    description: "Complete transparency: The tech stack, timeline, and AI prompts that built this platform in 2 days.",
    type: "article",
  }
};

export default function BuildingFullStackVibeCoder48Hours() {
  return (
    <BlogPostLayout
      title="I Built This Entire Platform in 48 Hours (Here's How)"
      category="Building in Public"
      date="2025-01-20"
      readTime="12 min read"
    >
      <BlogSection>
        <p className="text-xl text-white/90 leading-relaxed mb-6">
          Friday morning: domain purchased. Sunday evening: live in production with paying customers.
        </p>
        <p className="text-white/80 leading-relaxed">
          This is the complete build log of FullStackVibeCoder.com. Every decision. Every prompt. Every fuck-up.
          Complete transparency because that's how you learn.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Hour 0-2: Planning and Architecture</h2>
        <p>
          Most people skip this. They jump straight into code and end up rebuilding everything three times.
          I spent two hours mapping out:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li><strong>Core value prop:</strong> AI builds your software, humans review and ship it</li>
          <li><strong>User flow:</strong> Upload voice note → AI generates proposal → Client approves → We build → Deploy</li>
          <li><strong>Revenue model:</strong> Three tiers (Validation $47, Launch $197, Turnkey $497)</li>
          <li><strong>Tech stack:</strong> Next.js 14, Prisma, Supabase, Anthropic Claude, Stripe</li>
        </ul>

        <BlogHighlight title="Key Decision">
          <p>
            I chose Anthropic Claude over GPT-4 because Claude handles longer context windows better.
            When you're analyzing client voice notes and generating comprehensive business plans, you need
            that extra context capacity.
          </p>
        </BlogHighlight>
      </BlogSection>

      <BlogSection>
        <h2>Hour 2-8: Database Schema and Auth</h2>
        <p>
          This is where AI saves the most time. Setting up authentication used to take me a full day. Now?
        </p>
        <BlogQuote>
          <p>
            "Set up NextAuth.js with email magic links, Google OAuth, Prisma adapter, and session management.
            Include user roles and permissions system."
          </p>
        </BlogQuote>
        <p>
          Boom. Done in 45 minutes. I reviewed the code, tested edge cases, deployed.
        </p>
        <p className="mt-4">
          The Prisma schema was similar. I described the data model:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80 mt-4">
          <li>Users with authentication</li>
          <li>Projects with workflow states</li>
          <li>Proposals with pricing tiers</li>
          <li>Tasks with dependencies</li>
          <li>Deliverables with artifact storage</li>
        </ul>
        <p className="mt-4">
          Claude generated the entire schema. Relationships, indexes, constraints—all production-ready.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Hour 8-16: The AI Agent System</h2>
        <p>
          This was the hardest part. Building an orchestrator that manages multiple AI agents, each with
          different specializations. Here's what I built:
        </p>

        <div className="bg-black/40 border border-white/10 rounded-lg p-6 my-6">
          <h4 className="text-cyan-400 font-bold mb-4">Agent Architecture:</h4>
          <ol className="space-y-3 text-white/80">
            <li><strong>1. Intake Agent</strong> - Transcribes voice notes, extracts requirements</li>
            <li><strong>2. Scope Agent</strong> - Analyzes feasibility, identifies tech stack</li>
            <li><strong>3. Estimator Agent</strong> - Calculates time/cost, suggests tier</li>
            <li><strong>4. Proposal Agent</strong> - Generates client-facing proposal with visuals</li>
            <li><strong>5. Orchestrator</strong> - Coordinates workflow, manages state</li>
            <li><strong>6. Specialist Agents</strong> - Frontend, Backend, Database, DevOps</li>
          </ol>
        </div>

        <p className="mt-6">
          I built the base agent class first. Then each specialist inherited from it. The orchestrator
          manages the queue and passes context between agents.
        </p>

        <BlogHighlight title="What Broke">
          <p>
            Context management was a nightmare at first. Early agents were losing context after 3-4
            handoffs. I had to implement a context summarization system where each agent produces a
            concise summary that gets passed to the next agent along with the full history.
          </p>
          <p className="mt-3">
            Fixed it by implementing structured context objects with priority levels. Critical info
            gets preserved, fluff gets summarized.
          </p>
        </BlogHighlight>
      </BlogSection>

      <BlogSection>
        <h2>Hour 16-24: Client Portal and Dashboard</h2>
        <p>
          The client-facing UI had to be dead simple. No learning curve. Upload voice → See proposal →
          Approve → Track progress.
        </p>
        <p className="mt-4">
          I used AI to generate the entire dashboard:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80 mt-4">
          <li>Project cards with real-time status</li>
          <li>Proposal viewer with approve/revise actions</li>
          <li>Progress tracker with phase breakdowns</li>
          <li>Deliverables download area</li>
        </ul>
        <p className="mt-4">
          The cyberpunk theme (pink/cyan/green gradients on black) came from wanting something that
          stands out. Every other dev agency site looks the same—blue gradients, generic tech imagery.
          This needed personality.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Hour 24-36: Payment Integration and Billing</h2>
        <p>
          Stripe integration. The thing that used to take me 2 days. AI prompt:
        </p>
        <BlogQuote>
          <p>
            "Integrate Stripe Checkout with three pricing tiers. Handle webhook events for successful
            payments, failed payments, and subscription management. Update project status in database
            after payment confirmation."
          </p>
        </BlogQuote>
        <p className="mt-4">
          Two hours later: complete payment system. Webhooks working. Database updates triggering.
          Email confirmations sending.
        </p>
        <p className="mt-4">
          I tested with Stripe test mode, caught a race condition in the webhook handler, fixed it,
          pushed to prod.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Hour 36-42: Logo Generation and Branding</h2>
        <p>
          I integrated Dumpling AI (FLUX model) to auto-generate logos for client projects. Each project
          gets 5 logo variations based on their brand strategy.
        </p>
        <p className="mt-4">
          The flow: Client approves proposal → Orchestrator triggers task decomposition → Brand strategy
          agent creates visual identity → Dumpling generates logos → Client gets ZIP with all assets.
        </p>
        <p className="mt-4">
          This was pure value-add. Clients don't expect logo generation. But when they see 5 professional
          logo options included in their package? Instant wow factor.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Hour 42-48: Testing, Debugging, Deployment</h2>
        <p>
          The final stretch. Testing every user flow:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Sign up → Upload voice note → View proposal → Approve → Track project</li>
          <li>Payment failures and retry logic</li>
          <li>Edge cases (empty voice notes, unclear requirements)</li>
          <li>Mobile responsiveness</li>
          <li>Accessibility (WCAG 2.1 AA compliance)</li>
        </ul>

        <p className="mt-6">
          Found and fixed bugs:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-white/80 mt-4">
          <li>Voice transcription failing on long pauses (added silence detection)</li>
          <li>Proposal generation timing out on complex projects (added streaming)</li>
          <li>Mobile menu not closing on navigation (fixed state management)</li>
          <li>Database connection pool exhaustion (increased pool size, added timeout)</li>
        </ol>

        <p className="mt-6">
          Deployed to Vercel. Connected custom domain. Set up monitoring with Sentry. Live in production
          48 hours after starting.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>What I'd Do Differently</h2>
        <p>
          Honestly? Not much. The architecture held up. The AI agents work. The user flow is smooth.
        </p>
        <p className="mt-4">
          But if I were starting over:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80 mt-4">
          <li><strong>Plan context management first.</strong> I had to refactor this twice. Should've nailed it upfront.</li>
          <li><strong>Set up monitoring earlier.</strong> I deployed without Sentry. Bad idea. Caught production bugs by accident.</li>
          <li><strong>Write better prompts initially.</strong> I got lazy with some prompts, got mediocre code, had to iterate.</li>
        </ul>
      </BlogSection>

      <BlogSection>
        <h2>The Reality Check</h2>
        <p>
          Could I have built this without AI? Yes. Would it have taken 2-3 weeks? Absolutely.
        </p>
        <p className="mt-4">
          Authentication, database design, API routes, agent orchestration, payment integration, UI
          components, mobile responsiveness—all of it would've been manual. All of it would've accumulated
          bugs at 11 PM when I'm tired and cutting corners.
        </p>
        <p className="mt-4">
          AI doesn't get tired. AI doesn't skip error handling. AI generates production-ready code if
          you give it good prompts and review the output.
        </p>

        <BlogHighlight title="Bottom Line">
          <p className="font-semibold">
            48 hours. $6.50 in API costs. One developer. Production-ready platform with paying customers.
          </p>
          <p className="mt-3">
            This is vibe coding.
          </p>
        </BlogHighlight>
      </BlogSection>

      <BlogSection>
        <h2>Want the Prompts?</h2>
        <p>
          I'm documenting every prompt I used to build this. Complete engineering logs. What worked,
          what didn't, what I'd change.
        </p>
        <p className="mt-4">
          Building in public means showing the whole process. Including the messy parts.
        </p>
        <p className="mt-4">
          More posts coming soon. Subscribe or bookmark this page.
        </p>
      </BlogSection>
    </BlogPostLayout>
  );
}

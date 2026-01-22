import { Metadata } from 'next';
import { BlogPostLayout, BlogSection, BlogHighlight, BlogQuote } from '@/components/BlogPostLayout';

export const metadata: Metadata = {
  title: "Case Study: SaaS MVP in 3 Days for $2,500 | FullStackVibeCoder",
  description: "How we built a complete appointment booking SaaS from zero to paying customers in 72 hours. Tech stack, timeline, and exact costs.",
  keywords: "SaaS case study, MVP development, vibe coding, AI development",
  openGraph: {
    title: "Case Study: SaaS MVP in 3 Days for $2,500",
    description: "Real numbers from a recent build: appointment booking SaaS, 72 hours, $2,500 cost, paying customers.",
    type: "article",
  }
};

export default function CaseStudySaasMVP3Days() {
  return (
    <BlogPostLayout
      title="Case Study: SaaS MVP in 3 Days for $2,500"
      category="Case Studies"
      date="2025-01-18"
      readTime="10 min read"
    >
      <BlogSection>
        <p className="text-xl text-white/90 leading-relaxed mb-6">
          Client: Solo therapist trying to replace Calendly. Needed custom features Calendly doesn't offer.
          Budget: $2,500. Timeline: 3 days. Result: Fully functional SaaS with 12 paying customers in week one.
        </p>
        <p className="text-white/80 leading-relaxed">
          This is the complete breakdown. Timeline, tech stack, costs, problems we hit, and actual results.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>The Client's Problem</h2>
        <p>
          Sarah (therapist, licensed 8 years) was paying $12/month for Calendly Pro. But Calendly couldn't:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80 mt-4">
          <li>Let clients book same-day appointments (insurance requirement)</li>
          <li>Send automated intake forms before first session</li>
          <li>Block certain appointment types on specific days</li>
          <li>Integrate with her practice management software (TherapyNotes)</li>
          <li>White-label the booking page with her branding</li>
        </ul>

        <p className="mt-6">
          She'd looked at custom development. Got quoted $15K-25K with 6-8 week timelines. Way outside her budget.
        </p>

        <p className="mt-4">
          She found FullStackVibeCoder through a therapist Facebook group. Recorded a 4-minute voice note
          explaining what she needed. We sent a proposal in 5 hours.
        </p>

        <BlogHighlight title="Her Exact Requirements">
          <ul className="space-y-2">
            <li>✅ Calendar integration (Google Calendar)</li>
            <li>✅ Custom availability rules by appointment type</li>
            <li>✅ Automated intake forms sent via email</li>
            <li>✅ Same-day booking allowed</li>
            <li>✅ Payment processing (Stripe)</li>
            <li>✅ White-labeled booking page</li>
            <li>✅ TherapyNotes API integration</li>
            <li>✅ Client cancellation/rescheduling</li>
            <li>✅ Email/SMS reminders</li>
          </ul>
        </BlogHighlight>
      </BlogSection>

      <BlogSection>
        <h2>The Tech Stack</h2>
        <p>
          We chose tools for speed and reliability:
        </p>

        <div className="bg-black/40 border border-green-500/30 rounded-lg p-6 my-6">
          <h4 className="text-green-400 font-bold mb-4">Stack Breakdown:</h4>
          <div className="space-y-4 text-white/80">
            <div>
              <strong className="text-white">Frontend:</strong> Next.js 14 (App Router), Tailwind CSS, Shadcn UI
            </div>
            <div>
              <strong className="text-white">Backend:</strong> Next.js API routes, Prisma ORM
            </div>
            <div>
              <strong className="text-white">Database:</strong> PostgreSQL (Supabase)
            </div>
            <div>
              <strong className="text-white">Auth:</strong> NextAuth.js (email magic links)
            </div>
            <div>
              <strong className="text-white">Payments:</strong> Stripe Checkout + webhooks
            </div>
            <div>
              <strong className="text-white">Calendar:</strong> Google Calendar API
            </div>
            <div>
              <strong className="text-white">Email:</strong> Postmark (transactional emails)
            </div>
            <div>
              <strong className="text-white">SMS:</strong> Twilio (reminders)
            </div>
            <div>
              <strong className="text-white">Hosting:</strong> Vercel (frontend + API)
            </div>
            <div>
              <strong className="text-white">Custom Domain:</strong> Cloudflare (DNS + SSL)
            </div>
          </div>
        </div>

        <p className="mt-6">
          <strong>Why these choices?</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80 mt-4">
          <li><strong>Next.js 14:</strong> Fast to build, great DX, serverless API routes</li>
          <li><strong>Prisma:</strong> Type-safe database queries, migrations handled automatically</li>
          <li><strong>Supabase:</strong> Managed Postgres, generous free tier, built-in auth (we used NextAuth instead)</li>
          <li><strong>Vercel:</strong> Zero-config deployment, edge functions, automatic HTTPS</li>
        </ul>
      </BlogSection>

      <BlogSection>
        <h2>Day 1: Core Booking System (8 hours)</h2>
        <p>
          Started at 9 AM. First priority: basic booking flow.
        </p>

        <div className="space-y-4 mt-6">
          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 1-3: Database Schema</h4>
            <p className="text-white/80 mt-2">
              Designed Prisma schema for Users, Appointments, AppointmentTypes, Availability, Clients.
              AI generated the initial schema. I reviewed, added indexes and constraints, ran migrations.
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 3-5: Booking UI</h4>
            <p className="text-white/80 mt-2">
              Built the client-facing booking flow: Select appointment type → Pick date → Choose time →
              Enter details → Pay → Confirm. Used AI to generate the UI components, I adjusted styling
              for Sarah's branding (purple/teal palette).
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 5-8: Availability Logic</h4>
            <p className="text-white/80 mt-2">
              The complex part. Sarah's availability changes by day and appointment type. AI helped implement
              the logic: check provider availability → filter by appointment type rules → exclude booked slots →
              return available times. Tested edge cases (same-day booking, timezone handling, buffer times).
            </p>
          </div>
        </div>

        <BlogQuote>
          <p>
            "I gave AI detailed requirements: 'Implement availability calculation that respects provider weekly
            schedule, appointment-type-specific rules, buffer times between appointments, and same-day booking
            allowances. Return available slots in client's timezone.'"
          </p>
        </BlogQuote>

        <p className="mt-6">
          By end of Day 1: Clients could see available times and select slots. No payment yet. No calendar integration.
          But the core booking logic worked.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Day 2: Integrations and Payments (10 hours)</h2>
        <p>
          Day 2 was integration hell. APIs, webhooks, error handling.
        </p>

        <div className="space-y-4 mt-6">
          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 1-3: Stripe Integration</h4>
            <p className="text-white/80 mt-2">
              Stripe Checkout for payments. Webhook handler for successful payments (creates appointment,
              sends confirmation email, triggers calendar event). Tested with Stripe test mode. Handled
              edge cases (payment fails, user abandons checkout, duplicate webhooks).
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 3-6: Google Calendar API</h4>
            <p className="text-white/80 mt-2">
              OAuth setup so Sarah could connect her Google Calendar. When appointment is booked, create
              event on her calendar with client details. When client cancels, delete event. Syncing was
              tricky—had to handle rate limits and connection failures gracefully.
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 6-8: TherapyNotes Integration</h4>
            <p className="text-white/80 mt-2">
              TherapyNotes has a REST API (documentation is rough). After appointment booked, create client
              record in TherapyNotes with basic info. Sarah can then complete intake in their system. Had
              to reverse-engineer some undocumented API behavior.
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 8-10: Email System</h4>
            <p className="text-white/80 mt-2">
              Set up Postmark for transactional emails. Templates for booking confirmation, cancellation,
              rescheduling, reminders. Sarah reviewed copy, I made adjustments. Added intake form link to
              confirmation email (Google Forms for MVP, can build custom forms later).
            </p>
          </div>
        </div>

        <p className="mt-6">
          By end of Day 2: Full booking flow worked end-to-end. Payment → Calendar event → TherapyNotes record →
          Confirmation email. Tested 15+ bookings in test mode. All integrations working.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Day 3: Admin Dashboard and Polish (8 hours)</h2>
        <p>
          Final day: Give Sarah control over her system.
        </p>

        <div className="space-y-4 mt-6">
          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 1-4: Admin Dashboard</h4>
            <p className="text-white/80 mt-2">
              Built dashboard for Sarah: view upcoming appointments, manage availability, configure appointment
              types (name, duration, price, availability rules), view revenue stats, export data to CSV. Clean
              UI, easy to use.
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 4-6: Client Portal</h4>
            <p className="text-white/80 mt-2">
              Clients can log in (magic link auth) to view their appointments, cancel/reschedule, update
              contact info. Simple, mobile-friendly.
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-semibold">Hours 6-8: Final Testing and Deployment</h4>
            <p className="text-white/80 mt-2">
              Tested every flow. Found and fixed bugs (timezone edge case, calendar sync race condition,
              email template typo). Set up custom domain (booking.sarahtherapy.com). Deployed to Vercel
              production. Monitored first few hours for errors.
            </p>
          </div>
        </div>

        <BlogHighlight title="Launch Checklist">
          <ul className="space-y-1 text-sm">
            <li>✅ All integrations tested (Stripe, Google Calendar, TherapyNotes)</li>
            <li>✅ Mobile responsive (tested on iPhone, Android, iPad)</li>
            <li>✅ Email templates reviewed and approved</li>
            <li>✅ Custom domain connected and SSL working</li>
            <li>✅ Admin dashboard functional</li>
            <li>✅ Error monitoring set up (Sentry)</li>
            <li>✅ Database backups automated</li>
            <li>✅ Privacy policy and terms of service added</li>
          </ul>
        </BlogHighlight>

        <p className="mt-6">
          72 hours after starting: Fully functional SaaS live in production.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>The Costs (Real Numbers)</h2>
        <p>
          Complete breakdown of what we spent:
        </p>

        <div className="bg-black/40 border border-white/10 rounded-lg p-6 my-6">
          <h4 className="text-white font-bold mb-4">Development Costs:</h4>
          <div className="space-y-3 text-white/80">
            <div className="flex justify-between">
              <span>Client charged:</span>
              <span className="font-semibold text-green-400">$2,500</span>
            </div>
            <div className="border-t border-white/10 my-3"></div>
            <div className="flex justify-between">
              <span>Development time (26 hours × $50/hr):</span>
              <span className="font-semibold">$1,300</span>
            </div>
            <div className="flex justify-between">
              <span>AI API costs (Claude Sonnet):</span>
              <span className="font-semibold">$4.20</span>
            </div>
            <div className="border-t border-white/10 my-3"></div>
            <div className="flex justify-between">
              <span className="font-bold text-white">Profit:</span>
              <span className="font-bold text-green-400">$1,195.80</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-lg p-6 my-6">
          <h4 className="text-white font-bold mb-4">Ongoing Costs (Sarah pays):</h4>
          <div className="space-y-3 text-white/80 text-sm">
            <div className="flex justify-between">
              <span>Vercel Pro:</span>
              <span>$20/month</span>
            </div>
            <div className="flex justify-between">
              <span>Supabase Pro:</span>
              <span>$25/month</span>
            </div>
            <div className="flex justify-between">
              <span>Postmark (email):</span>
              <span>$10/month (1,000 emails)</span>
            </div>
            <div className="flex justify-between">
              <span>Twilio (SMS):</span>
              <span>~$15/month (estimate)</span>
            </div>
            <div className="flex justify-between">
              <span>Domain:</span>
              <span>$12/year</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe fees:</span>
              <span>2.9% + $0.30 per transaction</span>
            </div>
            <div className="border-t border-white/10 my-3"></div>
            <div className="flex justify-between">
              <span className="font-bold text-white">Total:</span>
              <span className="font-bold text-white">~$71/month + Stripe fees</span>
            </div>
          </div>
        </div>

        <p className="mt-6">
          Sarah was paying $12/month for Calendly. Now she's paying ~$71/month but getting exponentially
          more value: custom features, white-labeled, full control, better client experience.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Week One Results</h2>
        <p>
          We launched on a Monday. Here's what happened in the first week:
        </p>

        <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg p-6 my-6">
          <h4 className="text-green-400 font-bold text-lg mb-4">First Week Metrics:</h4>
          <div className="space-y-3 text-white/90">
            <div className="flex justify-between text-lg">
              <span>Total bookings:</span>
              <span className="font-bold">12</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Revenue processed:</span>
              <span className="font-bold text-green-400">$1,800</span>
            </div>
            <div className="flex justify-between">
              <span>Average appointment value:</span>
              <span>$150</span>
            </div>
            <div className="flex justify-between">
              <span>Cancellations:</span>
              <span>1 (rescheduled same day)</span>
            </div>
            <div className="flex justify-between">
              <span>Technical issues:</span>
              <span>0</span>
            </div>
            <div className="flex justify-between">
              <span>Client support requests:</span>
              <span>3 (all "how do I..." questions)</span>
            </div>
          </div>
        </div>

        <BlogQuote>
          <p className="text-green-400">
            "This is exactly what I needed. My clients love how easy it is to book. I love that everything
            syncs automatically. Already recommended you to two other therapists."
            <br /><br />
            <span className="text-white/60">— Sarah, Week 1 feedback</span>
          </p>
        </BlogQuote>
      </BlogSection>

      <BlogSection>
        <h2>What We'd Improve</h2>
        <p>
          No project is perfect. Here's what we'd change if we rebuilt it:
        </p>

        <ul className="list-disc list-inside space-y-3 text-white/80 mt-4">
          <li>
            <strong>Better timezone handling:</strong> We tested US timezones thoroughly. Didn't consider
            international clients. Sarah got a booking from someone in UK, timezone display was confusing.
            Fixed in Day 4 (post-launch).
          </li>
          <li>
            <strong>More thorough TherapyNotes testing:</strong> Their API rate limits are aggressive.
            Didn't hit them in testing. Hit them on Day 3 when Sarah imported her existing client list.
            Added rate limiting and retry logic.
          </li>
          <li>
            <strong>Mobile optimization:</strong> Tested on a few devices but should've done more extensive
            mobile testing. One UI element was slightly off on smaller Android screens. Quick CSS fix.
          </li>
          <li>
            <strong>Admin onboarding:</strong> Should've built a guided setup wizard for first-time users.
            Sarah figured it out, but a step-by-step onboarding would've been smoother.
          </li>
        </ul>

        <p className="mt-6">
          All minor issues. None were showstoppers. All fixed within days of launch.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>The Follow-Up</h2>
        <p>
          Two weeks after launch, Sarah referred two therapist friends. We're building similar systems for
          both (with slight customizations). Each paying $2,500.
        </p>
        <p className="mt-4">
          We're now exploring a white-label version for therapists. Same core system, multi-tenant architecture,
          $49/month subscription. If we get 50 therapists, that's $2,450/month recurring.
        </p>
        <p className="mt-4">
          One client project turned into a potential SaaS business. That's the power of solving real problems
          for real people.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>Key Takeaways</h2>
        <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-6 my-6">
          <h4 className="text-cyan-400 font-bold text-lg mb-4">What Made This Work:</h4>
          <ol className="space-y-3 text-white/90">
            <li>
              <strong>1. Clear requirements from the start.</strong> Sarah's 4-minute voice note was detailed.
              No scope creep. No confusion.
            </li>
            <li>
              <strong>2. Right tools for the job.</strong> Next.js + Prisma + Vercel = fast development and
              reliable hosting.
            </li>
            <li>
              <strong>3. AI for boilerplate, humans for logic.</strong> AI generated UI components, API routes,
              database queries. I reviewed everything, handled complex business logic, tested edge cases.
            </li>
            <li>
              <strong>4. MVP mindset.</strong> Built exactly what Sarah needed. No extra features. No over-engineering.
              Ship fast, iterate based on real usage.
            </li>
            <li>
              <strong>5. Real testing before launch.</strong> 15+ test bookings in every scenario. Caught bugs
              before real clients did.
            </li>
          </ol>
        </div>
      </BlogSection>

      <BlogSection>
        <h2>Can You Build a SaaS in 3 Days?</h2>
        <p>
          Yes. But you need:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80 mt-4">
          <li>Clear requirements (not "build me a SaaS")</li>
          <li>Right tech stack (modern, well-documented tools)</li>
          <li>AI for acceleration (not automation)</li>
          <li>Development experience (to review, test, debug)</li>
          <li>MVP focus (ship core features, iterate later)</li>
        </ul>

        <p className="mt-6">
          If you have those, yes. 3 days is realistic.
        </p>
        <p className="mt-4">
          If you're missing any, expect 2-4 weeks. Still way faster than traditional development.
        </p>

        <BlogHighlight>
          <p className="text-lg font-semibold">
            This is vibe coding. AI does the heavy lifting. Humans provide the judgment. Together, we build
            software 10x faster than either could alone.
          </p>
        </BlogHighlight>
      </BlogSection>
    </BlogPostLayout>
  );
}

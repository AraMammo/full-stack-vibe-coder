import { Metadata } from 'next';
import { BlogPostLayout, BlogSection, BlogWarning, BlogQuote } from '@/components/BlogPostLayout';

export const metadata: Metadata = {
  title: "I Paid $3K for an 'AI Agency Course' - Complete Scam | FullStackVibeCoder",
  description: "Fell for the AI agency guru playbook. Paid $3,000. Got recycled ChatGPT prompts. Here are the exact red flags I missed.",
  keywords: "AI agency scam, course scam, AI development course, fake guru",
  openGraph: {
    title: "I Paid $3K for an 'AI Agency Course' - Complete Scam",
    description: "The exact red flags I missed before wasting $3,000 on recycled ChatGPT prompts.",
    type: "article",
  }
};

export default function AIAgencyCourseScam() {
  return (
    <BlogPostLayout
      title="I Paid $3K for an 'AI Agency Course' - Complete Scam"
      category="Scam Alerts"
      date="2025-01-17"
      readTime="9 min read"
    >
      <BlogSection>
        <p className="text-xl text-white/90 leading-relaxed mb-6">
          November 2024. I paid $2,997 for an "exclusive" AI agency course. Got 47 videos of recycled
          ChatGPT prompts and a Discord full of people asking for refunds.
        </p>
        <p className="text-white/80 leading-relaxed">
          I'm writing this so you don't make the same mistake. Here's exactly how they got me.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>The Hook</h2>
        <p>
          It started with a YouTube ad. Guy in his 20s, sitting in front of a MacBook at a coffee shop.
          "I built a $50K/month AI agency in 90 days with zero coding experience."
        </p>
        <p className="mt-4">
          The ad was polished. Professional editing. B-roll of expensive cars and laptops. Screenshots
          of Stripe dashboards showing big deposits.
        </p>
        <p className="mt-4">
          I clicked. Watched the 45-minute "free training." Classic sales funnel:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-white/80 mt-4">
          <li>Pain point: "You're working too hard for too little money"</li>
          <li>Promise: "AI does the work, you collect the checks"</li>
          <li>Proof: More Stripe screenshots, client testimonials (probably fake)</li>
          <li>Urgency: "Only 50 spots available, closes in 24 hours"</li>
          <li>Price: $2,997 (down from "$9,997 value")</li>
        </ol>

        <BlogWarning title="Red Flag #1: Fake Urgency">
          <p>
            That "24 hours remaining" timer? It resets. I checked from an incognito window three days
            later. Same countdown. Same "only 50 spots left."
          </p>
          <p className="mt-3">
            If someone's pushing you to buy RIGHT NOW, it's manipulation. Legitimate opportunities don't
            expire in 24 hours.
          </p>
        </BlogWarning>
      </BlogSection>

      <BlogSection>
        <h2>What I Actually Got</h2>
        <p>
          After paying $2,997, here's what was inside:
        </p>

        <div className="bg-black/40 border border-red-500/30 rounded-lg p-6 my-6 space-y-4">
          <div>
            <h4 className="text-red-400 font-bold">47 Videos (Total: 6 hours of content)</h4>
            <ul className="list-disc list-inside space-y-2 text-white/70 mt-2">
              <li>20 videos on "mindset" (generic motivation)</li>
              <li>12 videos on "finding clients" (cold email templates)</li>
              <li>10 videos on "AI prompts" (basic ChatGPT prompts anyone could write)</li>
              <li>5 videos on "scaling" (hire VAs in the Philippines)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-red-400 font-bold">Discord Community</h4>
            <p className="text-white/70 mt-2">
              450 members. 90% asking "How do I get clients?" The other 10% trying to sell their own courses.
            </p>
          </div>

          <div>
            <h4 className="text-red-400 font-bold">The "AI Prompts Library"</h4>
            <p className="text-white/70 mt-2">
              37 ChatGPT prompts. Things like "Write me a cold email for [INDUSTRY]" and "Create a landing
              page for [SERVICE]." Shit you could find on Reddit for free.
            </p>
          </div>

          <div>
            <h4 className="text-red-400 font-bold">Weekly "Coaching Calls"</h4>
            <p className="text-white/70 mt-2">
              Pre-recorded Zoom sessions where the guru reads questions from chat and gives vague answers.
              Zero personalization. Zero actionable advice.
            </p>
          </div>
        </div>

        <p className="mt-6">
          Total actual value? Maybe $50. Definitely not $2,997.
        </p>
      </BlogSection>

      <BlogSection>
        <h2>The Red Flags I Missed</h2>
        <p>
          Looking back, the warning signs were everywhere. I was just too excited to see them.
        </p>

        <BlogWarning title="Red Flag #2: No Real Portfolio">
          <p>
            The instructor showed screenshots but never linked to actual projects. No GitHub repos.
            No live sites. No client names. Just screenshots (which can be faked).
          </p>
          <p className="mt-3">
            <strong>Lesson:</strong> If someone's selling AI development services, they should have a
            portfolio. Real projects with URLs you can visit. If they don't show their work, they're hiding something.
          </p>
        </BlogWarning>

        <BlogWarning title="Red Flag #3: 'No Technical Skills Required'">
          <p>
            The pitch: "You don't need to know how to code. AI does everything."
          </p>
          <p className="mt-3">
            This is bullshit. You can't sell AI development services if you don't understand development.
            You can't review AI-generated code if you can't read code. You can't debug production issues
            if you have zero technical knowledge.
          </p>
          <p className="mt-3">
            <strong>Lesson:</strong> AI is a tool, not a replacement for skill. Anyone selling you
            "automated income with no expertise required" is lying.
          </p>
        </BlogWarning>

        <BlogWarning title="Red Flag #4: Vague About Their Own Business">
          <p>
            When asked "What AI services do you actually provide?", the answer was always generic:
            "We help businesses automate with AI" or "We build custom AI solutions."
          </p>
          <p className="mt-3">
            Never specifics. Never case studies with real numbers. Never details about tech stacks or
            implementation.
          </p>
          <p className="mt-3">
            <strong>Lesson:</strong> Real developers talk specifics. "I built X using Y and Z, here's
            the GitHub repo, here's the live site." Fake gurus talk in abstractions.
          </p>
        </BlogWarning>

        <BlogWarning title="Red Flag #5: Income Claims Without Proof">
          <p>
            "$50K/month in 90 days" sounds amazing. But where's the proof? Stripe screenshots can be
            photoshopped in 5 minutes.
          </p>
          <p className="mt-3">
            I asked for verifiable proof—tax returns, bank statements, anything independently confirmed.
            Got "I don't share personal financial documents." Classic dodge.
          </p>
          <p className="mt-3">
            <strong>Lesson:</strong> Extraordinary claims require extraordinary evidence. If someone's
            making huge income claims but won't verify them, assume they're lying.
          </p>
        </BlogWarning>
      </BlogSection>

      <BlogSection>
        <h2>The Refund Request</h2>
        <p>
          After two weeks, I realized I'd been scammed. I requested a refund. Here's what happened:
        </p>
        <ol className="list-decimal list-inside space-y-3 text-white/80 mt-4">
          <li>
            <strong>Day 1:</strong> Submitted refund request through their support portal
          </li>
          <li>
            <strong>Day 3:</strong> Got automated email: "Refunds processed within 7-10 business days"
          </li>
          <li>
            <strong>Day 12:</strong> No refund. Emailed again. No response.
          </li>
          <li>
            <strong>Day 18:</strong> Found the fine print: "No refunds after 7 days or if you've accessed more than 30% of content"
          </li>
          <li>
            <strong>Day 20:</strong> Disputed charge with credit card. They fought it with proof I "accessed the content"
          </li>
        </ol>

        <p className="mt-6">
          I lost the dispute. $2,997 gone.
        </p>

        <BlogQuote>
          <p className="text-red-400 font-semibold">
            Their refund policy is designed to trap you. By the time you realize it's a scam, you're
            past the refund window.
          </p>
        </BlogQuote>
      </BlogSection>

      <BlogSection>
        <h2>What I Actually Learned (The Hard Way)</h2>
        <p>
          That $2,997 wasn't a total loss. It taught me exactly what NOT to do.
        </p>

        <div className="bg-gradient-to-br from-cyan-500/10 to-green-500/10 border border-cyan-500/30 rounded-lg p-6 my-6">
          <h4 className="text-cyan-400 font-bold text-lg mb-4">Real Lessons:</h4>
          <ol className="space-y-4 text-white/90">
            <li>
              <strong>1. AI agencies ARE real businesses.</strong> But they require actual skills—prompt
              engineering, code review, system design, client communication. You can't automate your way
              to $50K/month with zero expertise.
            </li>
            <li>
              <strong>2. Courses are almost never worth $3K.</strong> Everything you need to learn is
              available for free or cheap ($10-50 Udemy courses). Expensive courses are priced for
              perceived value, not actual value.
            </li>
            <li>
              <strong>3. If it sounds too good to be true, it is.</strong> "No experience required,
              automated income, work 2 hours a week"—all lies designed to extract money from desperate people.
            </li>
            <li>
              <strong>4. Real success takes work.</strong> I built FullStackVibeCoder in 48 hours, but
              I have 18 years of development experience. AI amplified my skills. It didn't replace them.
            </li>
          </ol>
        </div>
      </BlogSection>

      <BlogSection>
        <h2>How to Protect Yourself</h2>
        <p>
          Before buying any AI course or service:
        </p>

        <div className="space-y-4 mt-6">
          <div className="bg-black/40 border border-white/10 rounded-lg p-5">
            <h4 className="text-white font-semibold mb-2">✅ Do This:</h4>
            <ul className="list-disc list-inside space-y-2 text-white/80">
              <li>Google "[instructor name] scam" and "[instructor name] review"</li>
              <li>Check Reddit, Trustpilot, Better Business Bureau</li>
              <li>Ask for verifiable portfolio (live URLs, not screenshots)</li>
              <li>Request detailed curriculum before paying</li>
              <li>Verify income claims with independent evidence</li>
              <li>Read the full refund policy (screenshot it)</li>
              <li>Start with free resources first (YouTube, documentation, blogs)</li>
            </ul>
          </div>

          <div className="bg-black/40 border border-red-500/30 rounded-lg p-5">
            <h4 className="text-red-400 font-semibold mb-2">❌ Red Flags:</h4>
            <ul className="list-disc list-inside space-y-2 text-white/80">
              <li>Fake countdown timers</li>
              <li>"Limited spots" that never run out</li>
              <li>Unverifiable income claims</li>
              <li>"No experience required" for complex technical work</li>
              <li>Vague descriptions of what's included</li>
              <li>No refund policy or restrictive refunds</li>
              <li>Pressure to "act now"</li>
              <li>Upsells inside the course</li>
            </ul>
          </div>
        </div>
      </BlogSection>

      <BlogSection>
        <h2>The Bottom Line</h2>
        <p>
          I lost $2,997 to an AI course scam. You don't have to.
        </p>
        <p className="mt-4">
          Real AI development requires real skills. AI amplifies those skills—it doesn't replace them.
          Anyone selling you "push button riches" is selling you lies.
        </p>
        <p className="mt-4">
          Learn the fundamentals. Practice with free tools. Build real projects. Share your work publicly.
          That's how you get good.
        </p>
        <p className="mt-4">
          No $3K course required.
        </p>

        <BlogWarning>
          <p className="text-lg">
            If you've been scammed by a similar course, share your story. Sunlight is the best disinfectant.
            The more people talk about these scams, the fewer people fall for them.
          </p>
        </BlogWarning>
      </BlogSection>
    </BlogPostLayout>
  );
}

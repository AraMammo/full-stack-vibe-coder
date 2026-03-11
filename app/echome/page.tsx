import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EchoMe — Agentic Content Marketing API | Fullstack Vibe Coder',
  description: 'Your brand voice, encoded. Agentic content marketing with high-converting content generated via managed pipeline or direct API access.',
};

function BottleneckBadge() {
  return (
    <div className="flex justify-center pt-12 pb-4">
      <a
        href="https://bottlenecklabs.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface hover:bg-white/10 hover:border-accent/30 transition-all text-xs text-fsvc-text-secondary hover:text-fsvc-text-secondary"
      >
        Built by Bottleneck Labs
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-white/5" />;
}

export default function EchoMePage() {
  return (
    <main className="min-h-screen pt-20 pb-16">

      {/* ═══════════════════════════════════════════ */}
      {/* HERO                                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
            Agentic Content Marketing
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
            style={{
              background: '#FF5C35',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your brand voice, encoded.
          </h1>
          <p className="text-lg sm:text-xl text-fsvc-text-secondary max-w-3xl mx-auto mb-3">
            We analyze your best-performing content, encode your tone and positioning into a reusable model, then generate campaign-ready content across every channel — on demand.
          </p>
          <p className="text-base text-fsvc-text-disabled max-w-2xl mx-auto mb-4">
            Not a chatbot. Not a prompt wrapper. A managed content pipeline with direct API access.
          </p>
          <p className="text-sm text-fsvc-text-disabled mb-8">
            Starting at $987/mo &middot; Cancel anytime
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 text-lg font-bold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
            >
              Book a Discovery Call
            </a>
            <a
              href="#how-it-works"
              className="inline-block px-8 py-4 text-lg font-medium rounded-lg border border-white/20 bg-surface hover:bg-white/10 text-white transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* THE PROBLEM                                 */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            Content is the bottleneck.
          </h2>
          <p className="text-fsvc-text-secondary text-center max-w-2xl mx-auto mb-14">
            You know you need to post consistently. But every piece takes hours, sounds slightly off-brand, and by the time it&apos;s approved — the moment has passed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Without EchoMe */}
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-red-400">Without EchoMe</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Draft → review → rewrite → review → approve → post. 3-5 hours per piece.',
                  'Freelancers who almost sound like you, but not quite.',
                  'AI tools that produce generic slop you\'d never publish.',
                  'Brand guidelines PDF that nobody reads or follows.',
                  '2-3 posts per week, max — because there\'s no time for more.',
                  'Inconsistent voice across LinkedIn, email, and ads.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-fsvc-text-secondary text-sm">
                    <span className="text-red-400/60 mt-1 shrink-0">&mdash;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* With EchoMe */}
            <div className="p-6 rounded-2xl border border-accent-2/20 bg-accent-2/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-2/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-accent-2">With EchoMe</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Topic in → platform-ready content out. Seconds, not hours.',
                  'Your actual voice — encoded from your best-performing content.',
                  'Content that reads like your top writer on their best day.',
                  'Brand model that enforces consistency at the API level.',
                  '30-100+ pieces per month without adding headcount.',
                  'One voice across every channel, every time.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-fsvc-text-secondary text-sm">
                    <svg className="w-4 h-4 text-accent-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* METRICS                                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                metric: '10x',
                label: 'Content Output',
                detail: 'Same team. Same hours. 10x the publishable content. EchoMe eliminates the blank page — you go straight from topic to final draft.',
              },
              {
                metric: '100%',
                label: 'On-Brand',
                detail: 'Every piece passes through your encoded voice model. Tone, vocabulary, sentence structure, positioning — locked in at the system level.',
              },
              {
                metric: '~3x',
                label: 'Engagement Lift',
                detail: 'Content optimized for each platform\'s algorithm and audience expectations. LinkedIn posts that read like LinkedIn. Emails that convert like emails.',
              },
            ].map((prop) => (
              <div
                key={prop.label}
                className="p-6 rounded-2xl border border-border bg-surface"
              >
                <div
                  className="text-5xl font-black mb-1"
                  style={{
                    background: '#FF5C35',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {prop.metric}
                </div>
                <div className="text-sm text-fsvc-text-disabled mb-3">{prop.label}</div>
                <p className="text-fsvc-text-secondary text-sm">{prop.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS                                */}
      {/* ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            How Encoding Works
          </h2>
          <p className="text-fsvc-text-secondary text-center max-w-2xl mx-auto mb-14">
            Three steps to go from &ldquo;we need content&rdquo; to a content engine that sounds exactly like you.
          </p>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Feed Us Your Best Work',
                description: 'Send us 15-30 pieces of your highest-performing content. Blog posts, LinkedIn posts, emails, sales pages — anything that sounds like you at your best. We also take brand guidelines, tone docs, and competitor examples of what you don\'t want to sound like.',
                detail: 'This is the raw material. The more signal we get, the sharper your voice model becomes.',
              },
              {
                step: '02',
                title: 'We Encode Your Voice',
                description: 'Our pipeline analyzes your content across 12 dimensions: sentence rhythm, vocabulary range, emotional register, argument structure, opener patterns, CTA style, formality level, jargon density, metaphor usage, audience assumptions, objection handling patterns, and proof style.',
                detail: 'The output is a voice model — a structured prompt architecture that reproduces your writing style with high fidelity. Not a persona. Not a character sheet. A compression of your actual patterns.',
              },
              {
                step: '03',
                title: 'Generate On Demand',
                description: 'Give EchoMe a topic, a platform, and an intent (educate, sell, engage). It returns a ready-to-publish piece in your voice. Via the dashboard, or hit the API directly from your own tools — CMS, Zapier, n8n, custom workflows.',
                detail: 'Every generation passes through your voice model. The output is consistent whether you generate 5 pieces or 500.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div
                  className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black border border-accent/30"
                  style={{
                    background: 'rgba(255, 92, 53, 0.10)',
                  }}
                >
                  <span
                    style={{
                      background: '#FF5C35',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-fsvc-text-secondary mb-2">{item.description}</p>
                  <p className="text-fsvc-text-disabled text-sm">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* OUTPUT EXAMPLES                             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            What Comes Out
          </h2>
          <p className="text-fsvc-text-secondary text-center max-w-2xl mx-auto mb-14">
            One topic. Multiple platforms. Every piece sounds like you wrote it — because the model learned how you write.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                platform: 'LinkedIn Post',
                color: 'from-blue-500/20 to-blue-600/10',
                borderColor: 'border-blue-500/20',
                example: `Most founders think their content problem is volume.

It's not. It's consistency.

You can pump out 30 posts a month. But if 10 sound like your CEO, 10 sound like ChatGPT, and 10 sound like your intern — you don't have a content strategy.

You have noise.

The fix isn't "write more." It's encode your voice once, then scale it.

That's what we built EchoMe to do.`,
              },
              {
                platform: 'Email (Cold Outreach)',
                color: 'from-accent/20 to-rose-600/10',
                borderColor: 'border-accent/20',
                example: `Subject: Your content team is a bottleneck

Hey {{first_name}},

Noticed {{company}} has been ramping up LinkedIn presence — 3 posts last week. Good cadence.

But here's the thing: your CEO's posts sound nothing like your product marketing. And your product marketing sounds nothing like your sales emails.

That's a brand coherence problem, and it compounds at scale.

We encode brand voices into a reusable model. One voice, every channel.

Worth 15 minutes?`,
              },
              {
                platform: 'Twitter/X Thread',
                color: 'from-gray-500/20 to-gray-600/10',
                borderColor: 'border-gray-500/20',
                example: `🧵 Why your AI-generated content sounds like everyone else's:

1/ You're using the same models as everyone else
2/ With the same generic prompts
3/ And zero encoding of YOUR voice

The output? Corporate gray. Indistinguishable from the next brand in the feed.

4/ The fix: encode your top-performing content into a voice model.

Not a persona prompt. A compression of your actual writing patterns.

5/ Topic in → your voice out. At any scale.

That's EchoMe. Link in bio.`,
              },
              {
                platform: 'Ad Copy (Meta/Google)',
                color: 'from-green-500/20 to-emerald-600/10',
                borderColor: 'border-green-500/20',
                example: `[Headline]
Stop sounding like every other brand in the feed.

[Primary Text]
Your best content has a voice. A rhythm. A point of view. But you can't clone your top writer — and AI tools don't know your brand.

EchoMe encodes your voice into a reusable model. Feed it a topic, get back content that sounds like you wrote it.

30+ pieces/month. One consistent voice. Starting at $987/mo.

[CTA] Book a Demo`,
              },
            ].map((item) => (
              <div
                key={item.platform}
                className={`rounded-2xl border ${item.borderColor} bg-gradient-to-b ${item.color} overflow-hidden`}
              >
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{item.platform}</span>
                  <span className="text-xs text-fsvc-text-disabled">EchoMe output</span>
                </div>
                <div className="px-5 py-4">
                  <pre className="text-sm text-fsvc-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                    {item.example}
                  </pre>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-fsvc-text-disabled text-sm mt-8">
            These are illustrative examples. Your output will match your encoded voice, not ours.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* CAPABILITIES GRID                           */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            What&apos;s Under the Hood
          </h2>
          <p className="text-fsvc-text-secondary text-center max-w-2xl mx-auto mb-14">
            EchoMe isn&apos;t a prompt template. It&apos;s a managed pipeline with three integrated systems.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Generate',
                subtitle: 'Content Engine',
                description: 'API-driven generation across formats: social posts, email sequences, ad copy, blog outlines, landing page copy, product descriptions. Each request returns platform-formatted, publish-ready content.',
                details: ['REST API + dashboard UI', 'Batch generation (up to 50/request)', 'Template library for recurring formats', 'Webhook callbacks for async workflows'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
              },
              {
                title: 'Encode',
                subtitle: 'Voice Model',
                description: 'Your brand voice compressed into a structured model. Not a system prompt — a multi-layer representation of how you communicate, trained on your actual output.',
                details: ['12-dimension voice analysis', 'Anti-patterns (what to avoid)', 'Audience-aware register shifts', 'Quarterly re-calibration included'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                ),
              },
              {
                title: 'Optimize',
                subtitle: 'Platform Engine',
                description: 'Content shaped for each channel\'s native format, character limits, audience expectations, and algorithm preferences. Not just "make it shorter" — structurally different per platform.',
                details: ['LinkedIn, X, email, Meta, Google', 'Platform-specific hooks & CTAs', 'Character/format compliance', 'A/B variant generation'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((cap) => (
              <div
                key={cap.title}
                className="p-6 rounded-2xl border border-border bg-surface hover:border-accent-2/20 transition-all"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 border border-border text-accent-2 mb-4">
                  {cap.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{cap.title}</h3>
                <p className="text-sm text-accent mb-3">{cap.subtitle}</p>
                <p className="text-fsvc-text-secondary text-sm mb-4">{cap.description}</p>
                <ul className="space-y-1.5">
                  {cap.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-fsvc-text-disabled text-xs">
                      <span className="w-1 h-1 rounded-full bg-accent-2/60 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* WHO IT'S FOR                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            Who EchoMe Is For
          </h2>
          <p className="text-fsvc-text-secondary text-center max-w-2xl mx-auto mb-14">
            EchoMe works best for teams that already have a voice — they just can&apos;t scale it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Founders',
                description: 'You\'re the voice of the brand. You can write, but you can\'t write enough. EchoMe clones your output so you can focus on building.',
              },
              {
                title: 'Marketing Teams',
                description: 'You manage 3-5 channels with 1-2 writers. EchoMe turns your team into a content factory without hiring.',
              },
              {
                title: 'Agencies',
                description: 'You manage multiple client voices. EchoMe lets you encode each client\'s voice separately and generate at scale across all of them.',
              },
              {
                title: 'Developer Teams',
                description: 'You want content in your CI/CD pipeline. EchoMe\'s API lets you generate content programmatically — triggered by product launches, changelog updates, or custom events.',
              },
            ].map((persona) => (
              <div
                key={persona.title}
                className="p-5 rounded-2xl border border-border bg-surface"
              >
                <h3 className="text-lg font-bold text-white mb-2">{persona.title}</h3>
                <p className="text-fsvc-text-secondary text-sm">{persona.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* COST COMPARISON                             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            The Math
          </h2>
          <p className="text-fsvc-text-secondary text-center max-w-2xl mx-auto mb-14">
            EchoMe replaces the most expensive, slowest part of your content operation.
          </p>

          <div className="space-y-4">
            {[
              {
                option: 'In-house content marketer',
                cost: '$6,000–$10,000/mo',
                output: '8-15 pieces/month',
                perPiece: '$400–$1,250/piece',
                highlight: false,
              },
              {
                option: 'Content agency',
                cost: '$3,000–$8,000/mo',
                output: '10-20 pieces/month',
                perPiece: '$150–$800/piece',
                highlight: false,
              },
              {
                option: 'Freelance writers (2-3)',
                cost: '$2,000–$5,000/mo',
                output: '8-12 pieces/month',
                perPiece: '$166–$625/piece',
                highlight: false,
              },
              {
                option: 'EchoMe (Starter)',
                cost: '$987/mo',
                output: '30 pieces/month',
                perPiece: '$33/piece',
                highlight: true,
              },
              {
                option: 'EchoMe (Growth)',
                cost: '$1,500/mo',
                output: '1,000 API calls/month',
                perPiece: '$1.50/call',
                highlight: true,
              },
            ].map((row) => (
              <div
                key={row.option}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                  row.highlight
                    ? 'border-accent-2/30 bg-accent-2/5'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="sm:w-1/3">
                  <span className={`font-bold ${row.highlight ? 'text-accent-2' : 'text-white'}`}>
                    {row.option}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <span className="text-fsvc-text-secondary">
                    <span className="text-gray-600">Cost: </span>
                    {row.cost}
                  </span>
                  <span className="text-fsvc-text-secondary">
                    <span className="text-gray-600">Output: </span>
                    {row.output}
                  </span>
                  <span className={row.highlight ? 'text-accent-2 font-bold' : 'text-fsvc-text-secondary'}>
                    <span className={row.highlight ? 'text-accent-2' : 'text-gray-600'}>Unit: </span>
                    {row.perPiece}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-fsvc-text-disabled text-sm text-center mt-6">
            And none of the alternatives guarantee brand consistency — or give you API access.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* PRICING                                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            Pricing
          </h2>
          <p className="text-fsvc-text-secondary text-center mb-4 max-w-2xl mx-auto">
            All plans include voice encoding, onboarding, and quarterly re-calibration. Cancel anytime.
          </p>
          <p className="text-fsvc-text-disabled text-center text-sm mb-12">
            Voice encoding is included in your first month — no separate setup fee.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$987',
                period: '/mo',
                tagline: 'For founders and small teams getting started with scaled content.',
                featured: false,
                features: [
                  { text: '30 posts/month (managed)', bold: true },
                  'Single brand voice',
                  '2 platform formats (e.g. LinkedIn + Email)',
                  '100 API calls/mo',
                  'Dashboard access',
                  'Email support (48h response)',
                  'Quarterly voice re-calibration',
                ],
              },
              {
                name: 'Growth',
                price: '$1,500',
                period: '/mo',
                tagline: 'For teams that want full API access and multi-channel coverage.',
                featured: true,
                features: [
                  { text: '1,000 API calls/mo', bold: true },
                  '3 brand voices',
                  'All platform formats',
                  'Analytics dashboard',
                  'Batch generation (50/request)',
                  'Webhook integrations',
                  'Priority support (24h response)',
                  'Monthly voice re-calibration',
                ],
              },
              {
                name: 'Enterprise',
                price: '$2,000',
                period: '/mo',
                tagline: 'For agencies and teams managing multiple brands at scale.',
                featured: false,
                features: [
                  { text: 'Unlimited API calls', bold: true },
                  'Unlimited brand voices',
                  'Custom integrations',
                  'Dedicated account manager',
                  'SLA guarantee (99.9% uptime)',
                  'Custom voice dimensions',
                  'SSO + team management',
                  'Weekly re-calibration',
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`relative p-6 rounded-2xl border transition-all ${
                  tier.featured
                    ? 'border-accent/50 bg-accent/10 md:scale-105'
                    : 'border-border bg-surface hover:border-white/20'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-xs font-bold text-white whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-fsvc-text-disabled text-sm mb-4">{tier.tagline}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className="text-4xl font-black"
                    style={{
                      background: '#FF5C35',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {tier.price}
                  </span>
                  <span className="text-fsvc-text-disabled">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => {
                    const text = typeof feature === 'string' ? feature : feature.text;
                    const isBold = typeof feature === 'object' && feature.bold;
                    return (
                      <li key={text} className={`flex items-start gap-2 ${isBold ? 'text-white font-medium' : 'text-fsvc-text-secondary'}`}>
                        <svg className="w-5 h-5 text-accent-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {text}
                      </li>
                    );
                  })}
                </ul>
                <a
                  href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-3 rounded-lg font-bold transition-all ${
                    tier.featured
                      ? 'bg-accent text-white hover:opacity-90'
                      : 'border border-white/20 bg-surface hover:bg-white/10 text-white'
                  }`}
                >
                  Book a Call
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ                                         */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-14">
            Questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: 'How is this different from ChatGPT or Claude with a good prompt?',
                a: 'A good prompt gets you 60-70% of the way. EchoMe\'s voice model encodes 12 dimensions of your writing style — sentence rhythm, argument structure, vocabulary constraints, emotional register — and enforces them consistently across every generation. It\'s the difference between telling someone "write like me" and giving them a compression of your actual patterns.',
              },
              {
                q: 'What if I don\'t have 15-30 pieces of existing content?',
                a: 'We can work with as few as 8-10 strong pieces. We can also conduct a voice interview — a 45-minute session where we extract your positioning, tone preferences, and communication style directly. The model won\'t be as precise initially, but it improves with each re-calibration cycle.',
              },
              {
                q: 'Can I edit the output before publishing?',
                a: 'Yes — and you should, at least initially. Most clients edit 20-30% of outputs in the first month. By month 2-3, after re-calibration, that drops to under 10%. The goal is "ready to publish with a quick scan," not "zero human involvement."',
              },
              {
                q: 'What does "API access" actually mean?',
                a: 'A REST API endpoint. You send a POST request with a topic, platform, and intent — you get back formatted content. You can integrate this into your CMS, trigger it from Zapier/n8n, or build custom workflows. The Growth and Enterprise plans include webhook callbacks for async generation.',
              },
              {
                q: 'How long does onboarding take?',
                a: 'Voice encoding takes 3-5 business days from when we receive your content samples. You\'ll have your first batch of generated content within your first week.',
              },
              {
                q: 'What happens if I cancel?',
                a: 'You keep everything generated during your subscription. API access stops at the end of your billing period. Your voice model is your IP — we\'ll export it for you on request. No lock-in, no exit fees.',
              },
              {
                q: 'Do you support languages other than English?',
                a: 'Currently English only. Multilingual support is on the roadmap. If you need another language, book a call and we\'ll discuss a custom engagement.',
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-fsvc-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL CTA                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              background: '#FF5C35',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your best content, on repeat.
          </h2>
          <p className="text-fsvc-text-secondary mb-3">
            Book a 15-minute discovery call. We&apos;ll assess your content operation, show you how encoding works, and give you a realistic picture of what EchoMe can do for your specific use case.
          </p>
          <p className="text-fsvc-text-disabled text-sm mb-8">
            No pitch deck. No 45-minute demo. Just a conversation about your content.
          </p>
          <a
            href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-bold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Book a Discovery Call
          </a>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

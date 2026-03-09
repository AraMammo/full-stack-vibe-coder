import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EchoMe — Agentic Content Marketing API | ShipKit',
  description: 'Your brand voice, encoded. Agentic content marketing with high-converting content generated via managed pipeline or direct API access.',
};

function BottleneckBadge() {
  return (
    <div className="flex justify-center pt-12 pb-4">
      <a
        href="https://bottlenecklabs.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-pink-500/30 transition-all text-xs text-gray-400 hover:text-gray-300"
      >
        Built by Bottleneck Labs
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

export default function EchoMePage() {
  return (
    <main className="min-h-screen pt-20 pb-16">
      {/* Hero */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium mb-6">
            Agentic Content Marketing
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your brand voice, encoded.
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            High-converting content generated via managed pipeline or direct API access.
            Stop writing from scratch — let your encoded brand voice do the work.
          </p>
          <a
            href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-bold rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90 transition-opacity"
          >
            Book a Call
          </a>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                metric: '10x',
                label: 'Content Output',
                title: 'Speed',
                description: 'Generate campaign-ready content in seconds, not hours. Scale your content machine without scaling your team.',
              },
              {
                metric: '100%',
                label: 'On-Brand',
                title: 'Brand Consistency',
                description: 'Tone, vocabulary, and positioning encoded into every piece. Your brand voice stays locked in across every channel.',
              },
              {
                metric: '3x',
                label: 'Engagement Lift',
                title: 'Conversion',
                description: 'Content optimized for platform and audience. Every piece engineered to drive action.',
              },
            ].map((prop) => (
              <div
                key={prop.title}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-pink-500/30 transition-all"
              >
                <div
                  className="text-4xl font-black mb-1"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {prop.metric}
                </div>
                <div className="text-sm text-gray-500 mb-4">{prop.label}</div>
                <h3 className="text-xl font-bold text-white mb-2">{prop.title}</h3>
                <p className="text-gray-400">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
            What EchoMe Does
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Generate',
                description: 'API-driven content generation. Feed it a topic, get back platform-ready posts, emails, and ad copy — all in your voice.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
              },
              {
                title: 'Encode',
                description: 'Brand voice codification. We analyze your best content and distill your tone, vocabulary, and positioning into a reusable model.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                ),
              },
              {
                title: 'Optimize',
                description: 'Platform-native formatting. Content is shaped for each channel — LinkedIn, Twitter, email, ads — maximizing engagement per platform.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((cap) => (
              <div
                key={cap.title}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-500/30 transition-all text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-white/10 text-cyan-400 mb-4">
                  {cap.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{cap.title}</h3>
                <p className="text-gray-400">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            Pricing
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Choose the plan that fits your content volume. All plans include brand voice encoding.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$987',
                period: '/mo',
                featured: false,
                features: [
                  '30 posts/month',
                  'Single brand voice',
                  '2 platform formats',
                  '100 API calls/mo',
                  'Email support',
                ],
              },
              {
                name: 'Growth',
                price: '$1,500',
                period: '/mo',
                featured: true,
                features: [
                  'Full API access (1,000 calls/mo)',
                  '3 brand voices',
                  'All platform formats',
                  'Analytics dashboard',
                  'Priority support',
                ],
              },
              {
                name: 'Enterprise',
                price: '$2,000',
                period: '/mo',
                featured: false,
                features: [
                  'Unlimited API calls',
                  'Unlimited brand voices',
                  'Custom integrations',
                  'Dedicated account manager',
                  'SLA guarantee',
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`relative p-6 rounded-2xl border transition-all ${
                  tier.featured
                    ? 'border-pink-500/50 bg-gradient-to-b from-pink-500/10 to-cyan-500/10 scale-105'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className="text-4xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899, #06b6d4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {tier.price}
                  </span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-gray-300">
                      <svg className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-3 rounded-lg font-bold transition-all ${
                    tier.featured
                      ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90'
                      : 'border border-white/20 bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  Book a Call
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to encode your brand voice?
          </h2>
          <p className="text-gray-400 mb-8">
            Book a discovery call and we&apos;ll show you how EchoMe fits your content workflow.
          </p>
          <a
            href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-bold rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90 transition-opacity"
          >
            Book a Discovery Call
          </a>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

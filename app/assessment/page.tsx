'use client';

import { useState } from 'react';

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

export default function AssessmentPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen pt-20 pb-16">
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
            Free Tool
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-6"
            style={{
              background: '#FF5C35',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bottleneck Diagnostic Quiz
          </h1>
          <p className="text-lg text-fsvc-text-secondary max-w-2xl mx-auto mb-12">
            12 interactive questions across 4 categories. Get a personalized assessment of your operational bottlenecks with actionable recommendations and a downloadable PDF report.
          </p>

          {/* Coming Soon Card */}
          <div className="p-8 rounded-2xl border border-border bg-surface max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-fsvc-text-secondary mb-6">
              The full interactive quiz is being migrated. Enter your email to get notified when it&apos;s live.
            </p>

            {submitted ? (
              <div className="p-4 rounded-lg bg-accent-2/10 border border-accent-2/30 text-accent-2 font-medium">
                You&apos;re on the list! We&apos;ll notify you when the quiz is live.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-accent text-white font-bold hover:opacity-90 transition-opacity shrink-0"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* What to Expect */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {[
              { title: 'Process & Workflow', description: 'Identify manual steps eating your team\'s time' },
              { title: 'Technology & Tools', description: 'Find gaps in your tech stack integration' },
              { title: 'Team & Communication', description: 'Spot handoff failures and knowledge silos' },
              { title: 'Growth & Scale', description: 'Uncover what breaks when you 10x volume' },
            ].map((cat) => (
              <div key={cat.title} className="p-4 rounded-xl border border-border bg-surface">
                <h3 className="text-white font-bold mb-1">{cat.title}</h3>
                <p className="text-fsvc-text-secondary text-sm">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

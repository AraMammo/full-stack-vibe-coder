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

export default function ROICalculatorPage() {
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
            ROI Calculator
          </h1>
          <p className="text-lg text-fsvc-text-secondary max-w-2xl mx-auto mb-12">
            Calculate the real cost of your manual processes. Input your current workflow details and see exactly how much you&apos;d save with automation — current vs. automated cost comparison with annual savings projection.
          </p>

          {/* Coming Soon Card */}
          <div className="p-8 rounded-2xl border border-border bg-surface max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-fsvc-text-secondary mb-6">
              The interactive calculator is being migrated. Enter your email to get notified when it&apos;s ready.
            </p>

            {submitted ? (
              <div className="p-4 rounded-lg bg-accent-2/10 border border-accent-2/30 text-accent-2 font-medium">
                You&apos;re on the list! We&apos;ll notify you when the calculator is live.
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

          {/* What You'll Calculate */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {[
              { title: 'Process Name', description: 'Identify the specific workflow to analyze' },
              { title: 'Hours/Week', description: 'How much time your team spends on this process' },
              { title: 'People Involved', description: 'Number of team members touching this workflow' },
              { title: 'Hourly Rate', description: 'Blended cost per hour for the involved team' },
            ].map((input) => (
              <div key={input.title} className="p-4 rounded-xl border border-border bg-surface">
                <h3 className="text-white font-bold mb-1">{input.title}</h3>
                <p className="text-fsvc-text-secondary text-sm">{input.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

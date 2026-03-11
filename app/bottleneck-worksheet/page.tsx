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

export default function BottleneckWorksheetPage() {
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
            5-Minute Bottleneck Worksheet
          </h1>
          <p className="text-lg text-fsvc-text-secondary max-w-2xl mx-auto mb-12">
            A downloadable PDF with a critical path mapping template, danger zone checklist, and cost impact calculator. Map your biggest bottleneck in 5 minutes flat.
          </p>

          {/* Coming Soon Card */}
          <div className="p-8 rounded-2xl border border-border bg-surface max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-fsvc-text-secondary mb-6">
              The worksheet PDF is being prepared. Enter your email and we&apos;ll send it as soon as it&apos;s ready.
            </p>

            {submitted ? (
              <div className="p-4 rounded-lg bg-accent-2/10 border border-accent-2/30 text-accent-2 font-medium">
                You&apos;re on the list! We&apos;ll send the worksheet when it&apos;s ready.
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

          {/* What's Inside */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Critical Path Map', description: 'Template to visualize your process flow and identify the single biggest constraint' },
              { title: 'Danger Zone Checklist', description: 'Red-flag indicators that signal a bottleneck is costing you more than you think' },
              { title: 'Cost Impact Calculator', description: 'Quick math to quantify the weekly, monthly, and annual cost of doing nothing' },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl border border-border bg-surface">
                <h3 className="text-white font-bold mb-1">{item.title}</h3>
                <p className="text-fsvc-text-secondary text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

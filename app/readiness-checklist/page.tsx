'use client';

import { useState } from 'react';

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

export default function ReadinessChecklistPage() {
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
          <div className="inline-block px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium mb-6">
            Free Tool
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-6"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Automation Readiness Checklist
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            16-point interactive checklist across 4 categories. Find out if your processes are ready for automation — or what needs to change first.
          </p>

          {/* Coming Soon Card */}
          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-gray-400 mb-6">
              The interactive checklist is being migrated. Enter your email to get notified when it&apos;s live.
            </p>

            {submitted ? (
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium">
                You&apos;re on the list! We&apos;ll notify you when the checklist is live.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity shrink-0"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* Categories */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {[
              { title: 'Process Clarity', points: '4 checkpoints', description: 'Is your process documented, repeatable, and well-understood?' },
              { title: 'Volume & Impact', points: '4 checkpoints', description: 'Is the volume high enough and the impact meaningful enough to justify automation?' },
              { title: 'Technical Feasibility', points: '4 checkpoints', description: 'Can your systems support automation? Are the right APIs and data available?' },
              { title: 'Organizational Readiness', points: '4 checkpoints', description: 'Is your team ready for change? Do you have buy-in and capacity?' },
            ].map((cat) => (
              <div key={cat.title} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-bold">{cat.title}</h3>
                  <span className="text-xs text-pink-400 font-medium">{cat.points}</span>
                </div>
                <p className="text-gray-400 text-sm">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

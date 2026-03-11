import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pre-Flight Confidence Audit | Full Stack Vibe Coder',
  description: '15-dimension system audit in 48 hours. Risk matrix, remediation roadmap, and go/no-go recommendation.',
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

export default function PreFlightPage() {
  return (
    <main className="min-h-screen pt-20 pb-16">
      {/* Hero */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 text-accent-2 text-sm font-medium mb-6">
            Required Diagnostic Gate
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6"
            style={{
              background: '#FF5C35',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Pre-Flight Confidence Audit
          </h1>
          <p className="text-lg sm:text-xl text-fsvc-text-secondary max-w-3xl mx-auto mb-4">
            15-dimension system audit in 48 hours. Know exactly where you stand before committing to a build.
          </p>
          <p className="text-2xl font-bold text-white mb-8">$249 – $749</p>
          <a
            href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-bold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Start Your Audit
          </a>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
            Deliverables
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                title: '15-Point Audit Report',
                description: 'Comprehensive analysis across infrastructure, security, performance, code quality, architecture, and more.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                ),
              },
              {
                title: 'Risk Matrix',
                description: 'Severity-ranked findings with probability and impact scores. See your biggest risks at a glance.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ),
              },
              {
                title: 'Remediation Roadmap',
                description: 'Prioritized action plan with estimated effort. Know exactly what to fix first and why.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                ),
              },
              {
                title: 'Go/No-Go Recommendation',
                description: 'Clear verdict: are you ready to build, or do you need to fix foundations first? No ambiguity.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl border border-border bg-surface hover:border-accent-2/30 transition-all"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 border border-border text-accent-2 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-fsvc-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Book a call', description: 'We scope your system and confirm the audit tier ($249–$749 based on complexity).' },
              { step: '02', title: 'Grant access', description: 'Read-only access to your codebase, infrastructure, and deployment pipeline.' },
              { step: '03', title: 'Get your report', description: '48 hours later: full audit report, risk matrix, roadmap, and go/no-go verdict.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border border-accent/30"
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
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-fsvc-text-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Don&apos;t build on shaky ground.
          </h2>
          <p className="text-fsvc-text-secondary mb-8">
            Every build engagement starts with Pre-Flight. Know your risks before you invest.
          </p>
          <a
            href="https://cal.com/ara-mamourian-ynargr/bottleneck-discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-bold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Book a Call
          </a>
        </div>
      </section>

      <BottleneckBadge />
    </main>
  );
}

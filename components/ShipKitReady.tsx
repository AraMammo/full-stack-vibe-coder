'use client';

import { useEffect, useState } from 'react';

interface ShipKitReadyProps {
  projectId: string;
  projectName: string;
  liveSiteUrl?: string;
  githubRepoUrl?: string;
  downloadUrl: string;
  stripeConnectOnboardingUrl?: string;
  hostingStatus?: string;
}

export function ShipKitReady({
  projectId,
  projectName,
  liveSiteUrl,
  githubRepoUrl,
  downloadUrl,
  stripeConnectOnboardingUrl,
  hostingStatus,
}: ShipKitReadyProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const isLive = liveSiteUrl && hostingStatus === 'ACTIVE';

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl border-2 border-green-400/50 bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-accent-2/10 p-6">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                opacity: 0.8,
                fontSize: `${8 + Math.random() * 12}px`,
              }}
            >
              {['&#9733;', '&#9679;', '&#9670;'][i % 3] === '&#9733;' ? (
                <span className="text-yellow-400">&#9733;</span>
              ) : ['&#9733;', '&#9679;', '&#9670;'][i % 3] === '&#9679;' ? (
                <span className="text-accent">&#9679;</span>
              ) : (
                <span className="text-accent-2">&#9670;</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {isLive ? 'Your App is Live!' : 'Your Build is Ready!'}
            </h3>
            <p className="text-sm text-green-300">{projectName}</p>
          </div>
        </div>

        {isLive ? (
          <p className="mb-6 text-sm leading-relaxed text-fsvc-text-secondary">
            Your app is deployed and running. Users can sign up, make payments, and use your application right now.
          </p>
        ) : (
          <p className="mb-6 text-sm leading-relaxed text-fsvc-text-secondary">
            Everything has been generated and packaged for you. Your business materials,
            strategy documents, and deliverables are ready to download.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {liveSiteUrl && (
            <a
              href={liveSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-xl"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              Visit Your Live App
            </a>
          )}
          {stripeConnectOnboardingUrl && (
            <a
              href={stripeConnectOnboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Set Up Payments
            </a>
          )}
          {githubRepoUrl && (
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-raised"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          )}
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-raised"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download ZIP
          </a>
        </div>
      </div>
    </div>
  );
}

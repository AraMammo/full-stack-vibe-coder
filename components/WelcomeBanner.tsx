/**
 * Welcome Banner
 *
 * Shown to first-time users with no projects and no pending payment.
 * Dismissible via localStorage.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    // Check if already dismissed or if user just paid (DashboardEmptyState handles that)
    const wasDismissed = localStorage.getItem('welcomeDismissed') === 'true';
    const hasTier = sessionStorage.getItem('selectedTier');
    setDismissed(wasDismissed || !!hasTier);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('welcomeDismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="mb-8 relative rounded-xl border border-border bg-accent/5 p-6">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-fsvc-text-disabled hover:text-fsvc-text-secondary transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-xl font-bold text-white mb-4">Welcome to Full Stack Vibe Coder</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-sm font-bold text-accent">1</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Describe your business</p>
            <p className="text-xs text-fsvc-text-secondary">Tell us what you do and who you serve</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-2/20 border border-accent-2/30 flex items-center justify-center">
            <span className="text-sm font-bold text-accent-2">2</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">We build it</p>
            <p className="text-xs text-fsvc-text-secondary">AI generates your full-stack app</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <span className="text-sm font-bold text-green-400">3</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Go live</p>
            <p className="text-xs text-fsvc-text-secondary">Deployed with payments, auth, and hosting</p>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Build My App
      </Link>
    </div>
  );
}

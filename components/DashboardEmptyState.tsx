/**
 * Dashboard Empty State
 *
 * Detects if user just paid (via sessionStorage) and shows a polling loading state
 * while waiting for the webhook to create the project. Falls back to standard
 * empty state after timeout.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardEmptyStateProps {
  userName?: string;
}

export function DashboardEmptyState({ userName }: DashboardEmptyStateProps) {
  const router = useRouter();
  const [justPaid, setJustPaid] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const pollForProject = useCallback(async () => {
    try {
      const res = await fetch('/api/project/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          sessionStorage.removeItem('selectedTier');
          router.push(`/dashboard/project/${data.id}`);
          return true;
        }
      }
    } catch {
      // ignore fetch errors, keep polling
    }
    return false;
  }, [router]);

  useEffect(() => {
    const tier = sessionStorage.getItem('selectedTier');
    if (!tier) return;

    setJustPaid(true);

    let attempts = 0;
    const maxAttempts = 15; // 30 seconds at 2s intervals

    const interval = setInterval(async () => {
      attempts++;
      const found = await pollForProject();
      if (found || attempts >= maxAttempts) {
        clearInterval(interval);
        if (!found) {
          setTimedOut(true);
          sessionStorage.removeItem('selectedTier');
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollForProject]);

  if (!justPaid || timedOut) {
    return null; // Let the parent render the default empty state or WelcomeBanner
  }

  return (
    <div className="py-16 text-center max-w-md mx-auto">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
        <svg className="w-10 h-10 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">Setting up your ShipKit...</h3>
      <p className="text-gray-400 mb-2">
        {userName ? `Hang tight, ${userName}. ` : ''}Your project is being created.
      </p>
      <p className="text-sm text-gray-500">
        This usually takes just a few seconds.
      </p>
    </div>
  );
}

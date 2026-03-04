/**
 * Onboarding Checklist
 *
 * Shown on completed project detail pages. Helps users take action on their new app.
 * Items auto-check based on project data. Dismissible per project.
 */

'use client';

import { useState, useEffect } from 'react';

interface OnboardingChecklistProps {
  projectId: string;
  liveSiteUrl?: string;
  hasStripeConnect: boolean;
  hasCustomDomain: boolean;
  hasChangeRequest: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  href?: string;
  external?: boolean;
}

export function OnboardingChecklist({
  projectId,
  liveSiteUrl,
  hasStripeConnect,
  hasCustomDomain,
  hasChangeRequest,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  const storageKey = `onboarding-dismissed-${projectId}`;

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  const items: ChecklistItem[] = [
    {
      id: 'visit',
      label: 'Visit your live site',
      checked: !!liveSiteUrl,
      href: liveSiteUrl,
      external: true,
    },
    {
      id: 'stripe',
      label: 'Connect Stripe payments',
      checked: hasStripeConnect,
    },
    {
      id: 'domain',
      label: 'Add a custom domain',
      checked: hasCustomDomain,
    },
    {
      id: 'change',
      label: 'Request your first change',
      checked: hasChangeRequest,
    },
  ];

  const completedCount = items.filter((i) => i.checked).length;
  const allDone = completedCount === items.length;

  return (
    <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6" style={{ borderImage: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(6,182,212,0.3)) 1' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Get started with your app</h3>
          <p className="text-xs text-gray-400 mt-1">{completedCount}/{items.length} complete</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss checklist"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {/* Checkbox */}
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.checked
                ? 'bg-green-500 border-green-500'
                : 'border-gray-600'
            }`}>
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Label */}
            {item.href && !item.checked ? (
              <a
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>

      {allDone && (
        <p className="mt-4 text-sm text-green-400 font-medium">
          All done! Your app is fully set up.
        </p>
      )}
    </div>
  );
}

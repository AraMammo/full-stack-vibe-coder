'use client';

import { useState } from 'react';

interface HostingUpgradeProps {
  projectId: string;
  currentPlan: string;
  onUpgraded?: (newPlan: string) => void;
}

const tiers = [
  {
    plan: 'STARTER',
    name: 'Starter',
    price: '$49',
    features: [
      'Managed hosting',
      'Change requests',
      '30-day free trial',
      'SSL + CDN included',
    ],
  },
  {
    plan: 'GROWTH',
    name: 'Growth',
    price: '$149',
    popular: true,
    features: [
      'Everything in Starter',
      'Priority iterations',
      'Advanced analytics',
      'Custom email domain',
    ],
  },
  {
    plan: 'SCALE',
    name: 'Scale',
    price: '$349',
    features: [
      'Everything in Growth',
      'Dedicated infrastructure',
      'SLA guarantee',
      'White-glove support',
      'Private Slack channel',
    ],
  },
];

export function HostingUpgrade({ projectId, currentPlan, onUpgraded }: HostingUpgradeProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (plan === currentPlan) return;
    setLoading(plan);
    setError(null);

    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upgrade failed');
      onUpgraded?.(plan);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Hosting Plans</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isCurrent = tier.plan === currentPlan;
          const isDowngrade =
            tiers.findIndex((t) => t.plan === tier.plan) <
            tiers.findIndex((t) => t.plan === currentPlan);

          return (
            <div
              key={tier.plan}
              className={`relative p-5 rounded-xl border transition-colors ${
                isCurrent
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : tier.popular
                  ? 'border-pink-500/50 bg-pink-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {tier.popular && !isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-cyan-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Current Plan
                </span>
              )}

              <div className="text-center mb-4">
                <h4 className="text-white font-semibold">{tier.name}</h4>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-white">{tier.price}</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center text-xs text-gray-500">Your current plan</div>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier.plan)}
                  disabled={loading !== null}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    isDowngrade
                      ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                      : 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90'
                  } ${loading === tier.plan ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {loading === tier.plan
                    ? 'Processing...'
                    : isDowngrade
                    ? 'Downgrade'
                    : 'Upgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Enterprise tier */}
      <div className="p-5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
        <div>
          <h4 className="text-white font-semibold">Enterprise</h4>
          <p className="text-sm text-gray-400">
            $999+/mo &mdash; Custom builds, dedicated infrastructure, SLA guarantees
          </p>
        </div>
        <a
          href="mailto:ara@shipkit.io?subject=ShipKit Enterprise"
          className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors flex-shrink-0"
        >
          Contact Us
        </a>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

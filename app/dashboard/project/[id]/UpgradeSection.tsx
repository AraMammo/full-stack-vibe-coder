'use client';

import { useState } from 'react';
import { HostingUpgrade } from '@/components/HostingUpgrade';

export function UpgradeSection({ projectId, currentPlan }: { projectId: string; currentPlan: string }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (currentPlan === 'SCALE') return null;

  return (
    <div>
      {!showUpgrade ? (
        <button
          onClick={() => setShowUpgrade(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 text-pink-400 text-sm font-medium hover:from-pink-500/30 hover:to-cyan-500/30 transition-all"
        >
          Upgrade Plan
        </button>
      ) : (
        <div className="mt-4">
          <HostingUpgrade projectId={projectId} currentPlan={currentPlan} />
          <button
            onClick={() => setShowUpgrade(false)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-all"
        >
          Upgrade Plan
        </button>
      ) : (
        <div className="mt-4">
          <HostingUpgrade projectId={projectId} currentPlan={currentPlan} />
          <button
            onClick={() => setShowUpgrade(false)}
            className="mt-3 text-xs text-fsvc-text-disabled hover:text-fsvc-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

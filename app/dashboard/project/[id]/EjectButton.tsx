'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleEject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/project/${projectId}/eject`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Eject failed');
        return;
      }

      const data = await response.json();
      if (data.githubZipUrl) {
        window.open(data.githubZipUrl, '_blank');
      }
      router.refresh();
    } catch {
      alert('Eject request failed. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-sm text-red-600 font-medium">Cancel hosting and eject?</span>
        <button
          onClick={handleEject}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Ejecting...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
    >
      Eject &amp; Self-Host
    </button>
  );
}

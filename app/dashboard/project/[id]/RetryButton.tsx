'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RetryButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/project/${projectId}/retry`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Retry failed');
      }

      // Refresh the page to show the new build progress
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}
      <button
        onClick={handleRetry}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Restarting build...' : 'Retry Build'}
      </button>
    </div>
  );
}

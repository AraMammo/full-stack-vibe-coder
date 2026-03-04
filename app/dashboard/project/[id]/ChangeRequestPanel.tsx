'use client';

import { useState, useEffect } from 'react';

interface ChangeRequest {
  id: string;
  userMessage: string;
  status: string;
  affectedFiles: string[];
  diffSummary: string | null;
  deployUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

const statusBadge: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
  COMPLETE: { label: 'Complete', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
};

export function ChangeRequestPanel({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load existing change requests
  useEffect(() => {
    fetchRequests();
  }, [projectId]);

  // Poll for updates on pending/processing requests
  useEffect(() => {
    const hasPending = requests.some(
      (r) => r.status === 'PENDING' || r.status === 'PROCESSING'
    );
    if (!hasPending) return;

    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [requests, projectId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/change`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.changeRequests || []);
      }
    } catch {
      // Silently fail on poll
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError('Active hosting subscription required to request changes.');
        } else {
          setError(data.error || 'Failed to submit change request');
        }
        return;
      }

      setMessage('');
      // Refresh the list
      await fetchRequests();
    } catch (err) {
      setError('Failed to submit change request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Request a Change</h2>
      <p className="text-sm text-gray-500 mb-4">
        Describe what you want updated — we'll regenerate the affected files and redeploy.
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder='e.g. "Make the background darker" or "Add a testimonials section"'
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          disabled={isSubmitting}
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !message.trim() || message.trim().length < 5}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Change Request History */}
      {requests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Change History</h3>
          <div className="space-y-3">
            {requests.map((req) => {
              const badge = statusBadge[req.status] || statusBadge.PENDING;
              return (
                <div
                  key={req.id}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 flex-1">
                      &ldquo;{req.userMessage}&rdquo;
                    </p>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {req.diffSummary && (
                    <p className="text-xs text-gray-500 mt-1">{req.diffSummary}</p>
                  )}

                  {req.deployUrl && req.status === 'COMPLETE' && (
                    <a
                      href={req.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View updated site
                    </a>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

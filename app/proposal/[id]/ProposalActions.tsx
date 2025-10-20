/**
 * Proposal Actions Component
 *
 * Client-side actions for approving or requesting revisions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProposalActions({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposal/${proposalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve proposal');
      }

      // Success - refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
      setShowApproveModal(false);
    }
  };

  const handleRevisionRequest = async () => {
    if (!revisionNotes.trim()) {
      setError('Please provide details about what you\'d like revised');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposal/${proposalId}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: revisionNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request revision');
      }

      // Success - refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {!showRevisionForm ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowApproveModal(true)}
            disabled={isSubmitting}
            className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Approve Proposal
          </button>

          <button
            onClick={() => setShowRevisionForm(true)}
            disabled={isSubmitting}
            className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✎ Request Revision
          </button>
        </div>
      ) : (
        /* Revision Form */
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Revision</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tell us what you'd like changed. Our AI agents will review your feedback and generate an updated proposal.
          </p>

          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={6}
            placeholder="Example: I'd like to add a blog section to the website and extend the timeline to 14 days instead of 10."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRevisionRequest}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Revision Request'}
            </button>

            <button
              onClick={() => {
                setShowRevisionForm(false);
                setRevisionNotes('');
                setError(null);
              }}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Proposal?</h3>
            <p className="text-sm text-gray-600 mb-6">
              By approving this proposal, you're confirming that you're ready to move forward with the project. We'll begin work immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Approving...' : 'Yes, Approve'}
              </button>

              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isSubmitting}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

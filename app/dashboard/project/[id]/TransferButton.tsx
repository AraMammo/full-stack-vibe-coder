'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TransferState {
  step: 'idle' | 'form' | 'confirm' | 'transferring' | 'done';
  email: string;
  githubUsername: string;
  result?: {
    transferRequestId: string;
    claimUrls: {
      github?: string;
      neon?: string;
      vercel?: string;
    };
  };
  error?: string;
}

export function TransferButton({ projectId }: { projectId: string }) {
  const [state, setState] = useState<TransferState>({
    step: 'idle',
    email: '',
    githubUsername: '',
  });
  const router = useRouter();

  const handleTransfer = async () => {
    setState(s => ({ ...s, step: 'transferring', error: undefined }));
    try {
      const response = await fetch(`/api/project/${projectId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: state.email,
          customerGithubUsername: state.githubUsername || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setState(s => ({ ...s, step: 'confirm', error: data.error || 'Transfer failed' }));
        return;
      }

      const data = await response.json();
      setState(s => ({
        ...s,
        step: 'done',
        result: {
          transferRequestId: data.transferRequestId,
          claimUrls: data.claimUrls,
        },
      }));
      router.refresh();
    } catch {
      setState(s => ({ ...s, step: 'confirm', error: 'Transfer request failed. Please try again.' }));
    }
  };

  if (state.step === 'done' && state.result) {
    return (
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
        <p className="text-sm font-bold text-purple-400 mb-2">Transfer Initiated</p>
        <p className="text-xs text-gray-400 mb-3">
          The customer will receive emails with claim instructions for each service.
        </p>
        <div className="space-y-1">
          {state.result.claimUrls.github && (
            <a href={state.result.claimUrls.github} target="_blank" rel="noopener noreferrer" className="block text-xs text-cyan-400 hover:underline">
              GitHub Transfer
            </a>
          )}
          {state.result.claimUrls.neon && (
            <a href={state.result.claimUrls.neon} target="_blank" rel="noopener noreferrer" className="block text-xs text-cyan-400 hover:underline">
              Neon Database Claim
            </a>
          )}
          {state.result.claimUrls.vercel && (
            <a href={state.result.claimUrls.vercel} target="_blank" rel="noopener noreferrer" className="block text-xs text-cyan-400 hover:underline">
              Vercel Re-import
            </a>
          )}
        </div>
      </div>
    );
  }

  if (state.step === 'form' || state.step === 'confirm' || state.step === 'transferring') {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm font-bold text-white mb-3">Transfer Ownership</p>

        {state.step === 'form' && (
          <>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Customer Email *</label>
                <input
                  type="email"
                  value={state.email}
                  onChange={e => setState(s => ({ ...s, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">GitHub Username (optional)</label>
                <input
                  type="text"
                  value={state.githubUsername}
                  onChange={e => setState(s => ({ ...s, githubUsername: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="github-username"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!state.email) return;
                  setState(s => ({ ...s, step: 'confirm' }));
                }}
                disabled={!state.email}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
              <button
                onClick={() => setState({ step: 'idle', email: '', githubUsername: '' })}
                className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {state.step === 'confirm' && (
          <>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
              <p className="text-xs text-red-400 font-medium mb-1">This action cannot be undone</p>
              <p className="text-xs text-gray-400">
                This will transfer your GitHub repo, database, and Stripe account to{' '}
                <span className="text-white">{state.email}</span>.
                Your hosting subscription will be cancelled.
              </p>
            </div>
            {state.error && (
              <p className="text-xs text-red-400 mb-3">{state.error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleTransfer}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Confirm Transfer
              </button>
              <button
                onClick={() => setState(s => ({ ...s, step: 'form', error: undefined }))}
                className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Back
              </button>
            </div>
          </>
        )}

        {state.step === 'transferring' && (
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Transferring ownership...
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setState(s => ({ ...s, step: 'form' }))}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors"
    >
      Transfer Ownership
    </button>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface Finding {
  severity: string;
  file: string;
  issue: string;
  suggestion: string;
}

interface AgentEvaluation {
  id: string;
  skill: string;
  findings: Finding[];
  score: number | null;
  tokensUsed: number;
  executionTimeMs: number | null;
}

interface RefinementCycle {
  id: string;
  cycleNumber: number;
  status: string;
  filesRegenerated: string[];
  tokensUsed: number;
  executionTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
  evaluations: AgentEvaluation[];
}

const statusBadge: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  EVALUATING: { label: 'Evaluating', color: 'bg-cyan-500/20 text-cyan-400' },
  SYNTHESIZING: { label: 'Synthesizing', color: 'bg-purple-500/20 text-purple-400' },
  REGENERATING: { label: 'Regenerating', color: 'bg-pink-500/20 text-pink-400' },
  COMPLETE: { label: 'Complete', color: 'bg-green-500/20 text-green-400' },
  FAILED: { label: 'Failed', color: 'bg-red-500/20 text-red-400' },
};

const skillLabels: Record<string, { name: string; color: string }> = {
  structure: { name: 'Structure', color: 'text-blue-400' },
  brand_visual: { name: 'Brand/Visual', color: 'text-pink-400' },
  copy_conversion: { name: 'Copy/Conversion', color: 'text-green-400' },
  code_quality: { name: 'Code Quality', color: 'text-cyan-400' },
};

const severityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  major: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  minor: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

export function RefinementPanel({ projectId }: { projectId: string }) {
  const [cycles, setCycles] = useState<RefinementCycle[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  useEffect(() => {
    fetchCycles();
  }, [projectId]);

  // Poll when cycles are in progress
  useEffect(() => {
    const hasActive = cycles.some(
      (c) => c.status !== 'COMPLETE' && c.status !== 'FAILED'
    );
    if (!hasActive) return;
    const interval = setInterval(fetchCycles, 5000);
    return () => clearInterval(interval);
  }, [cycles, projectId]);

  const fetchCycles = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/refine`);
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
      }
    } catch {
      // Silently fail on poll
    }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/refine`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError('Active hosting subscription required for manual refinement.');
        } else {
          setError(data.error || 'Failed to start refinement');
        }
        return;
      }

      // Start polling
      setTimeout(fetchCycles, 2000);
    } catch {
      setError('Failed to start refinement');
    } finally {
      setIsRefining(false);
    }
  };

  const totalFindings = cycles.reduce(
    (sum, c) => sum + c.evaluations.reduce((s, e) => s + (e.findings?.length || 0), 0),
    0
  );
  const totalTokens = cycles.reduce((sum, c) => sum + c.tokensUsed, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">OpenClaw Refinement</h2>
          <p className="text-sm text-gray-400">
            AI-powered evaluation and refinement across 4 dimensions
          </p>
        </div>
        <button
          onClick={handleRefine}
          disabled={isRefining}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isRefining ? 'Starting...' : 'Refine'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary */}
      {cycles.length > 0 && (
        <div className="flex gap-4 mb-4 text-xs text-gray-500">
          <span>{cycles.length} cycle{cycles.length !== 1 ? 's' : ''}</span>
          <span>{totalFindings} findings</span>
          <span>{totalTokens.toLocaleString()} tokens</span>
        </div>
      )}

      {/* Cycles */}
      {cycles.length > 0 ? (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const badge = statusBadge[cycle.status] || statusBadge.PENDING;
            const isExpanded = expandedCycle === cycle.id;

            return (
              <div
                key={cycle.id}
                className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
              >
                {/* Cycle Header */}
                <button
                  onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">
                      Cycle {cycle.cycleNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                    {cycle.filesRegenerated.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {cycle.filesRegenerated.length} files updated
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded: Agent Evaluations */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-3 space-y-2">
                    {cycle.evaluations.map((evaluation) => {
                      const skill = skillLabels[evaluation.skill] || { name: evaluation.skill, color: 'text-gray-400' };
                      const findings = evaluation.findings || [];
                      const isSkillExpanded = expandedSkill === evaluation.id;

                      return (
                        <div key={evaluation.id}>
                          <button
                            onClick={() => setExpandedSkill(isSkillExpanded ? null : evaluation.id)}
                            className="w-full flex items-center justify-between py-2 px-2 rounded hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${skill.color}`}>
                                {skill.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {findings.length} finding{findings.length !== 1 ? 's' : ''}
                              </span>
                              {findings.filter((f) => f.severity === 'critical').length > 0 && (
                                <span className="text-xs text-red-400">
                                  {findings.filter((f) => f.severity === 'critical').length} critical
                                </span>
                              )}
                            </div>
                            <svg
                              className={`w-3 h-3 text-gray-500 transition-transform ${isSkillExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {isSkillExpanded && findings.length > 0 && (
                            <div className="ml-4 space-y-2 mt-1 mb-2">
                              {findings.map((finding, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded border text-xs ${severityColors[finding.severity] || severityColors.minor}`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold uppercase text-[10px]">
                                      {finding.severity}
                                    </span>
                                    <span className="text-gray-500 font-mono">
                                      {finding.file}
                                    </span>
                                  </div>
                                  <p className="mb-1">{finding.issue}</p>
                                  <p className="text-gray-500">{finding.suggestion}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No refinement cycles yet. Refinement runs automatically during build, or click Refine for a manual cycle.
        </p>
      )}
    </div>
  );
}

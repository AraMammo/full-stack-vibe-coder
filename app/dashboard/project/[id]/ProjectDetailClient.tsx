/**
 * Project Detail Client Component
 *
 * Handles real-time updates for project sections via SSE
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface Execution {
  id: number;
  status: string;
  output: string;
  completedAt: Date | null;
  executedAt: Date;
  prompt: {
    promptName: string;
    promptSection: string;
    orderIndex: number;
  };
}

interface ProgressData {
  projectId: string;
  completedCount: number;
  totalCount: number;
  progress: number;
  currentSection: string | null;
  status: string;
  codegenStatus: string | null;
  completedSections: {
    id: number;
    name: string;
    section: string;
    completedAt: Date | null;
  }[];
}

const PROVISIONING_STEP_LABELS: Record<string, string> = {
  supabase_create: 'Creating database...',
  database_migrate: 'Running migrations...',
  stripe_connect: 'Setting up payments...',
  github_push: 'Pushing code to GitHub...',
  vercel_create: 'Creating Vercel project...',
  vercel_deploy: 'Deploying to Vercel...',
  verify_live: 'Verifying site is live...',
  save_record: 'Saving deployment record...',
  hosting_subscription: 'Setting up hosting...',
};

const statusConfig = {
  completed: {
    icon: '✓',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    iconBg: 'bg-green-500',
  },
  in_progress: {
    icon: '⏳',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500',
  },
  pending: {
    icon: '○',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
    textColor: 'text-gray-400',
    iconBg: 'bg-gray-600',
  },
  failed: {
    icon: '✗',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconBg: 'bg-red-500',
  },
};

export function ProjectDetailClient({
  projectId,
  initialExecutions,
  isInProgress,
}: {
  projectId: string;
  initialExecutions: Execution[];
  isInProgress: boolean;
}) {
  const [executions, setExecutions] = useState<Execution[]>(initialExecutions);
  const [liveProgress, setLiveProgress] = useState<ProgressData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE for real-time updates
  useEffect(() => {
    if (!isInProgress) return;

    const eventSource = new EventSource(`/api/project/${projectId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setLiveProgress(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    // Listen for custom error events sent by the server (event: error)
    eventSource.addEventListener('error', (event: Event) => {
      // Check if this is a MessageEvent (custom error from server)
      if (event instanceof MessageEvent) {
        try {
          const errorData = JSON.parse(event.data);
          console.error('Server error event:', errorData);
        } catch (e) {
          console.error('Server error (unparseable):', event.data);
        }
      } else {
        // Connection-level error
        console.error('SSE connection error:', event);
      }
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [projectId, isInProgress]);

  // Merge live progress with initial executions
  const displayExecutions = executions.map((exec) => {
    const liveSection = liveProgress?.completedSections.find((s) => s.id === exec.id);
    if (liveSection) {
      return {
        ...exec,
        status: 'completed',
        completedAt: liveSection.completedAt,
      };
    }
    // Check if this is the current section
    if (liveProgress?.currentSection === exec.prompt.promptName && exec.status !== 'completed') {
      return {
        ...exec,
        status: 'in_progress',
      };
    }
    return exec;
  });

  const toggleSection = (id: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Parse provisioning step from codegenStatus
  const provisioningLabel = (() => {
    const cs = liveProgress?.codegenStatus;
    if (!cs || !cs.startsWith('provisioning:')) return null;
    const parts = cs.split(':');
    const step = parts[1];
    const status = parts[2];
    if (status === 'failed') return `Deployment step failed: ${step}`;
    return PROVISIONING_STEP_LABELS[step] || `Deploying: ${step}...`;
  })();

  return (
    <div className="space-y-4">
      {/* Provisioning Progress Banner */}
      {provisioningLabel && (
        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <p className="text-cyan-300 font-medium text-sm">{provisioningLabel}</p>
        </div>
      )}

      <h2 className="text-xl font-semibold text-white mb-4">All Sections</h2>

      {/* Sections Grid */}
      <div className="space-y-3">
        {displayExecutions.map((execution) => {
          const status = execution.status as keyof typeof statusConfig;
          const config = statusConfig[status] || statusConfig.pending;
          const isExpanded = expandedSections.has(execution.id);
          const isComplete = execution.status === 'completed';
          const isInProgressNow = execution.status === 'in_progress';

          return (
            <div
              key={execution.id}
              className={`border rounded-lg transition-all ${config.borderColor} ${
                isInProgressNow ? 'shadow-md' : 'shadow-sm'
              }`}
            >
              {/* Section Header */}
              <div className={`px-6 py-4 ${config.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {/* Status Icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full ${config.iconBg} text-white flex items-center justify-center mr-4 font-bold text-sm`}
                    >
                      {isInProgressNow ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        config.icon
                      )}
                    </div>

                    {/* Section Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-semibold ${config.textColor} truncate`}>
                        {execution.prompt.promptName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{execution.prompt.promptSection}</p>
                      {isComplete && execution.completedAt && (
                        <p className="text-xs text-gray-600 mt-1">
                          Completed {new Date(execution.completedAt).toLocaleString()}
                        </p>
                      )}
                      {isInProgressNow && (
                        <p className="text-xs text-cyan-400 mt-1 font-medium animate-pulse">
                          Generating now...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {isComplete && execution.output && (
                      <button
                        onClick={() => toggleSection(execution.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          isExpanded
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-white/10 text-green-400 border border-green-500/30 hover:bg-white/20'
                        }`}
                      >
                        {isExpanded ? 'Hide Output' : 'View Output'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Output */}
              {isExpanded && isComplete && execution.output && (
                <div className="px-6 py-4 bg-black/40 border-t border-white/10">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono bg-white/5 p-4 rounded border border-white/10 max-h-96 overflow-y-auto">
                      {execution.output}
                    </pre>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        const blob = new Blob([execution.output], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${execution.prompt.promptName.replace(/\s+/g, '_')}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Download as TXT
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {displayExecutions.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400">No sections found for this project.</p>
        </div>
      )}
    </div>
  );
}

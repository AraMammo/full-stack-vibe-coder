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
  completedSections: {
    id: number;
    name: string;
    section: string;
    completedAt: Date | null;
  }[];
}

const statusConfig = {
  completed: {
    icon: '✓',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    iconBg: 'bg-green-500',
  },
  in_progress: {
    icon: '⏳',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    iconBg: 'bg-blue-500',
  },
  pending: {
    icon: '○',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    iconBg: 'bg-gray-500',
  },
  failed: {
    icon: '✗',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">All Sections</h2>

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
                      <p className="text-sm text-gray-600 mt-0.5">{execution.prompt.promptSection}</p>
                      {isComplete && execution.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed {new Date(execution.completedAt).toLocaleString()}
                        </p>
                      )}
                      {isInProgressNow && (
                        <p className="text-xs text-blue-600 mt-1 font-medium animate-pulse">
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
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
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
                <div className="px-6 py-4 bg-white border-t border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
                      {execution.output}
                    </pre>
                  </div>
                  {/* Download Individual Section */}
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
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No sections found for this project.</p>
        </div>
      )}
    </div>
  );
}

/**
 * BIAB Project Card Component
 *
 * Displays a single BIAB project with real-time progress updates via SSE
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';

interface BIABProject {
  id: string;
  projectName: string;
  biabTier: 'VALIDATION_PACK' | 'LAUNCH_BLUEPRINT' | 'TURNKEY_SYSTEM';
  status: string;
  progress: number;
  completedPrompts: number;
  totalPrompts: number;
  createdAt: Date;
  v0ChatId: string | null;
  v0PreviewUrl: string | null;
  v0DeployUrl: string | null;
  v0GeneratedAt: Date | null;
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

const tierConfig = {
  VALIDATION_PACK: {
    name: 'Validation Pack',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    badgeColor: 'bg-blue-500',
  },
  LAUNCH_BLUEPRINT: {
    name: 'Launch Blueprint',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    badgeColor: 'bg-purple-500',
  },
  TURNKEY_SYSTEM: {
    name: 'Turnkey System',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
};

export function BIABProjectCard({ project }: { project: BIABProject }) {
  const [liveProgress, setLiveProgress] = useState<ProgressData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const tierInfo = tierConfig[project.biabTier];
  const isInProgress = project.status === 'IN_PROGRESS' || project.status === 'PENDING';
  const isCompleted = project.status === 'COMPLETED';

  // Connect to SSE for real-time updates
  useEffect(() => {
    if (!isInProgress) {
      console.log('[BIABProjectCard] Project not in progress, skipping SSE connection');
      return;
    }

    console.log('[BIABProjectCard] Connecting to SSE for project:', project.id);
    const eventSource = new EventSource(`/api/project/${project.id}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[BIABProjectCard] ✅ SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        console.log('[BIABProjectCard] 📊 Progress update:', {
          progress: data.progress,
          completed: data.completedCount,
          total: data.totalCount,
          current: data.currentSection,
          status: data.status
        });
        setLiveProgress(data);
      } catch (error) {
        console.error('[BIABProjectCard] ❌ Error parsing SSE data:', error);
      }
    };

    // Listen for custom error events sent by the server (event: error)
    eventSource.addEventListener('error', (event: Event) => {
      // Check if this is a MessageEvent (custom error from server)
      if (event instanceof MessageEvent) {
        try {
          const errorData = JSON.parse(event.data);
          console.error('[BIABProjectCard] ❌ Server error event:', errorData);
        } catch (e) {
          console.error('[BIABProjectCard] ❌ Server error (unparseable):', event.data);
        }
      } else {
        // Connection-level error
        console.error('[BIABProjectCard] ❌ SSE connection error:', event);
        console.log('[BIABProjectCard] Connection readyState:', eventSource.readyState);
      }
      // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      eventSource.close();
    });

    return () => {
      console.log('[BIABProjectCard] Closing SSE connection');
      eventSource.close();
    };
  }, [project.id, isInProgress]);

  const displayProgress = liveProgress?.progress ?? project.progress;
  const displayCompleted = liveProgress?.completedCount ?? project.completedPrompts;
  const displayTotal = liveProgress?.totalCount ?? project.totalPrompts;
  const currentSection = liveProgress?.currentSection;
  const completedSections = liveProgress?.completedSections ?? [];

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-bold text-white ${tierInfo.badgeColor} shadow`}
            >
              {tierInfo.name}
            </span>
            <StatusBadge status={project.status} type="project" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">{project.projectName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Progress */}
      {isInProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <span>
              Progress: {displayCompleted}/{displayTotal} sections complete
            </span>
            <span className="font-semibold">{displayProgress}%</span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
            role="progressbar"
            aria-valuenow={displayProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Section */}
      {isInProgress && currentSection && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg
              className="animate-spin h-4 w-4 text-blue-600 mr-2"
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
            <span className="text-sm text-blue-800">
              <strong>Currently generating:</strong> {currentSection}
            </span>
          </div>
        </div>
      )}

      {/* Completed Sections */}
      {completedSections.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center focus:outline-none focus:ring-2 focus:ring-gray-900 rounded px-2 py-1"
          >
            <span>Completed sections ({completedSections.length})</span>
            <svg
              className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExpanded && (
            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {completedSections.slice(0, 10).map((section) => (
                <li key={section.id} className="flex items-center text-sm text-gray-600 pl-2">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate">{section.name}</span>
                </li>
              ))}
              {completedSections.length > 10 && (
                <li className="text-sm text-gray-500 italic pl-2">
                  ...and {completedSections.length - 10} more
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* v0 Deployment Banner (if available) */}
      {isCompleted && (project.v0PreviewUrl || project.v0DeployUrl) && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-purple-900 mb-1">
                🚀 Your Site is Live on v0!
              </h4>
              <p className="text-xs text-purple-700 mb-3">
                Your Next.js application has been automatically generated and deployed. View it now or make refinements in v0.
              </p>
              <div className="flex flex-wrap gap-2">
                {project.v0DeployUrl && (
                  <a
                    href={project.v0DeployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-md hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Live Site
                  </a>
                )}
                {project.v0PreviewUrl && (
                  <a
                    href={project.v0PreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-white border-2 border-purple-300 text-purple-700 text-xs font-semibold rounded-md hover:bg-purple-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit in v0
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/project/${project.id}`}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
        >
          View Details →
        </Link>
        {isCompleted && (
          <Link
            href={`/api/delivery/${project.id}/download`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Download Package
          </Link>
        )}
      </div>
    </div>
  );
}

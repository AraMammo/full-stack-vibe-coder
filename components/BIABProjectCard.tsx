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

    eventSource.onerror = (error) => {
      console.error('[BIABProjectCard] ❌ SSE error:', error);
      console.log('[BIABProjectCard] Connection readyState:', eventSource.readyState);
      // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      eventSource.close();
    };

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

/**
 * VideoJobCard Component
 * Displays a faceless video generation job with status, progress, and actions
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface VideoJob {
  id: string;
  status: string;
  progress: number;
  createdAt: Date;
  completedAt?: Date | null;
  outputVideoUrl?: string | null;
  errorMessage?: string | null;
  videoDuration?: number | null;
  fileSize?: number | null;
  scenes: Array<{
    id: string;
    sceneIndex: number;
  }>;
}

export function VideoJobCard({ job }: { job: VideoJob }) {
  const [downloading, setDownloading] = useState(false);

  const statusConfig = {
    QUEUED: {
      label: 'Queued',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
    },
    UPLOADING: {
      label: 'Uploading',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
    },
    PROCESSING: {
      label: 'Processing',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
    },
    COMPLETED: {
      label: 'Completed',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
    },
    FAILED: {
      label: 'Failed',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
    },
  };

  const config = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.QUEUED;
  const isComplete = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';
  const isProcessing = job.status === 'PROCESSING' || job.status === 'UPLOADING';

  const handleDownload = async () => {
    if (!job.outputVideoUrl) return;

    setDownloading(true);
    try {
      const response = await fetch(job.outputVideoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faceless-video-${job.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download video. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              Faceless Video - {job.scenes.length} Scene{job.scenes.length !== 1 ? 's' : ''}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}
            >
              {config.label}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
            {isComplete && job.completedAt && (
              <>
                <span>•</span>
                <span>Completed {new Date(job.completedAt).toLocaleDateString()}</span>
              </>
            )}
            {job.videoDuration && (
              <>
                <span>•</span>
                <span>{formatDuration(job.videoDuration)}</span>
              </>
            )}
            {job.fileSize && (
              <>
                <span>•</span>
                <span>{formatFileSize(job.fileSize)}</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>
                  {job.status === 'UPLOADING' ? 'Uploading files...' : 'Generating video...'}
                </span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {isFailed && job.errorMessage && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
              Error: {job.errorMessage}
            </div>
          )}

          {/* Video Preview */}
          {isComplete && job.outputVideoUrl && (
            <div className="mt-3">
              <video
                controls
                className="w-full max-w-md rounded border border-gray-300"
                src={job.outputVideoUrl}
                style={{ maxHeight: '300px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-6 flex-shrink-0 flex flex-col gap-2">
          {isComplete && job.outputVideoUrl && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? 'Downloading...' : '⬇ Download Video'}
            </button>
          )}
          {!isComplete && !isFailed && (
            <span className="text-sm text-gray-500 italic">Processing...</span>
          )}
          {isFailed && (
            <Link
              href="/tools/faceless-video-generator"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              Try Again
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

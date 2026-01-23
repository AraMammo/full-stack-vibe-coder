'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StoryType {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  aspectRatio: string;
  captionsEnabled: boolean;
}

interface StoryProgress {
  id: string;
  name: string;
  status: string;
  progress: number;
  currentStep: string;
  totalScenes: number | null;
  totalShots: number | null;
  completedShots: number;
  generatedStory: string | null;
  finalVideoUrl: string | null;
  finalVideoCaptionedUrl: string | null;
  srtContent: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

type View = 'create' | 'progress' | 'complete';

export default function FacelessVideoGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [view, setView] = useState<View>('create');
  const [storyTypes, setStoryTypes] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [storyName, setStoryName] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [sourceContent, setSourceContent] = useState('');

  // Progress state
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [progress, setProgress] = useState<StoryProgress | null>(null);

  // Fetch story types on mount
  useEffect(() => {
    async function fetchStoryTypes() {
      try {
        const res = await fetch('/api/v2/faceless-video/story-types');
        const data = await res.json();
        if (data.success && data.storyTypes) {
          setStoryTypes(data.storyTypes);
          if (data.storyTypes.length > 0) {
            setSelectedTypeId(data.storyTypes[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch story types:', err);
        setError('Failed to load story types');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchStoryTypes();
    } else {
      setLoading(false);
    }
  }, [status]);

  // Poll for progress updates and trigger incremental processing
  const pollProgress = useCallback(async (storyId: string) => {
    try {
      // First, get current status
      const statusRes = await fetch(`/api/v2/faceless-video/stories/${storyId}`);
      const statusData = await statusRes.json();

      if (statusData.success && statusData.story) {
        setProgress(statusData.story);

        // Check if complete or failed
        if (statusData.story.status === 'completed' || statusData.story.status === 'failed') {
          if (statusData.story.finalVideoUrl || statusData.story.finalVideoCaptionedUrl) {
            setView('complete');
          }
          return; // Stop polling
        }

        // If generating media or building video, trigger processing
        if (['generating_media', 'building_video', 'adding_captions'].includes(statusData.story.status)) {
          try {
            // Call POST to process one shot or finalize
            const processRes = await fetch(`/api/v2/faceless-video/stories/${storyId}`, {
              method: 'POST',
            });
            const processData = await processRes.json();

            if (processData.success) {
              console.log(`[Processing] ${processData.message}`);

              // If done, update view
              if (processData.done && processData.finalVideoUrl) {
                // Fetch final status
                const finalRes = await fetch(`/api/v2/faceless-video/stories/${storyId}`);
                const finalData = await finalRes.json();
                if (finalData.success && finalData.story) {
                  setProgress(finalData.story);
                  setView('complete');
                }
                return;
              }
            }
          } catch (processErr) {
            console.error('Processing step failed:', processErr);
          }
        }

        // Continue polling (shorter interval during active processing)
        setTimeout(() => pollProgress(storyId), 2000);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      // Continue polling even on error
      setTimeout(() => pollProgress(storyId), 5000);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/v2/faceless-video/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storyName,
          storyTypeId: selectedTypeId,
          sourceContent: sourceContent,
          sourceType: 'text',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create story');
      }

      // Switch to progress view
      setCurrentStoryId(data.story.id);
      setView('progress');

      // Set initial progress
      setProgress({
        id: data.story.id,
        name: data.story.name,
        status: data.story.status,
        progress: 0,
        currentStep: 'Initializing...',
        totalScenes: null,
        totalShots: null,
        completedShots: 0,
        generatedStory: null,
        finalVideoUrl: null,
        finalVideoCaptionedUrl: null,
        srtContent: null,
        errorMessage: null,
        createdAt: data.story.createdAt,
        completedAt: null,
      });

      // Start polling for updates
      pollProgress(data.story.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate progress percentage - use backend-provided progress
  const getProgressPercentage = (): number => {
    if (!progress) return 0;
    return progress.progress;
  };

  // Get status label - use backend-provided currentStep
  const getStatusLabel = (): string => {
    if (!progress) return 'Loading...';
    return progress.currentStep;
  };

  // Authentication check
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black pt-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Faceless Video Generator
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Transform any article or script into a professional faceless video with AI-generated visuals, voiceovers, and captions.
          </p>
          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Sign In Required</h2>
            <p className="text-gray-300 mb-6">Please sign in to access the Faceless Video Generator.</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create View
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Create Faceless Video
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Paste an article, script, or any text content and we'll transform it into a professional video.
            </p>
          </div>

          {/* How it works */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-green-400 font-bold mb-4">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 font-bold">1</span>
                </div>
                <p className="text-gray-300">AI generates a story from your content</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 font-bold">2</span>
                </div>
                <p className="text-gray-300">Creates scenes with images & voiceovers</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 font-bold">3</span>
                </div>
                <p className="text-gray-300">Builds video with Ken Burns effects</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 font-bold">4</span>
                </div>
                <p className="text-gray-300">Adds animated captions & finalizes</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Story Name */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Story Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={storyName}
                onChange={(e) => setStoryName(e.target.value)}
                placeholder="e.g., LA Heist News Story"
                className="w-full px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
                required
              />
            </div>

            {/* Story Type */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Video Style <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {storyTypes.filter(t => !t.name.includes('INSTALL')).map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedTypeId === type.id
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-bold text-white mb-1">{type.name}</div>
                    <div className="text-sm text-gray-400">
                      {type.width}x{type.height} ({type.aspectRatio})
                      {type.captionsEnabled && ' • With Captions'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Content */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Source Content <span className="text-red-400">*</span>
              </label>
              <p className="text-gray-500 text-sm mb-2">
                Paste your article, news story, script, or any text content. The AI will transform it into a video narrative.
              </p>
              <textarea
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                placeholder="Paste your article or script here..."
                rows={12}
                className="w-full px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400 resize-none"
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {sourceContent.length} characters
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !storyName || !selectedTypeId || !sourceContent}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold text-lg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Video'}
            </button>

            <p className="text-center text-gray-500 text-sm">
              Processing typically takes 5-15 minutes depending on content length.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Progress View
  if (view === 'progress' && progress) {
    const percentage = getProgressPercentage();
    const totalShots = progress.totalShots || 0;
    const totalScenes = progress.totalScenes || 0;
    const completedShots = progress.completedShots || 0;

    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                {progress.name}
              </span>
            </h1>
            <p className="text-gray-400">{getStatusLabel()}</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300 font-medium">Overall Progress</span>
              <span className="text-green-400 font-bold">{percentage}%</span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-4">
            <ProgressStep
              label="Story Generated"
              done={!!progress.generatedStory}
              current={!progress.generatedStory && progress.status === 'generating_story'}
            />
            <ProgressStep
              label={`Scenes Created${totalScenes > 0 ? ` (${totalScenes})` : ''}`}
              done={totalScenes > 0}
              current={totalScenes === 0 && progress.status === 'generating_scenes'}
            />
            <ProgressStep
              label={`Shots Created${totalShots > 0 ? ` (${totalShots})` : ''}`}
              done={totalShots > 0}
              current={totalShots === 0 && progress.status === 'generating_scenes'}
            />
            <ProgressStep
              label={`Generating Media (${completedShots}/${totalShots} shots)`}
              done={completedShots === totalShots && totalShots > 0}
              current={completedShots < totalShots && progress.status === 'generating_media'}
            />
            <ProgressStep
              label="Building Video"
              done={progress.status === 'adding_captions' || progress.status === 'completed'}
              current={progress.status === 'building_video'}
            />
            <ProgressStep
              label="Adding Captions"
              done={progress.status === 'completed'}
              current={progress.status === 'adding_captions'}
            />
          </div>

          {/* Error Message */}
          {progress.errorMessage && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {progress.errorMessage}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>Started {new Date(progress.createdAt).toLocaleString()}</p>
            <p>This page will automatically update. You can also close it and check back later.</p>
          </div>

          {/* Back button */}
          <div className="mt-6 text-center">
            <Link
              href="/dashboard"
              className="text-green-400 hover:text-green-300 underline"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Complete View
  if (view === 'complete' && progress) {
    const videoUrl = progress.finalVideoCaptionedUrl || progress.finalVideoUrl;

    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Video Complete!
            </span>
          </h1>
          <p className="text-gray-400 mb-8">{progress.name}</p>

          {/* Video Preview */}
          {videoUrl && (
            <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 mb-6">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg"
                poster="/video-poster.png"
              />
            </div>
          )}

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {progress.finalVideoCaptionedUrl && (
              <a
                href={progress.finalVideoCaptionedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Download Video (with Captions)
              </a>
            )}
            {progress.finalVideoUrl && !progress.finalVideoCaptionedUrl && (
              <a
                href={progress.finalVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Download Video
              </a>
            )}
            {progress.srtContent && (
              <button
                onClick={() => {
                  const blob = new Blob([progress.srtContent!], { type: 'text/srt' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${progress.name}.srt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-8 py-3 border border-green-500 text-green-400 font-bold rounded-lg hover:bg-green-500/10 transition-colors"
              >
                Download SRT Captions
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setView('create');
                setStoryName('');
                setSourceContent('');
                setProgress(null);
                setCurrentStoryId(null);
              }}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create Another Video
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Progress view without data yet
  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-white text-xl">Loading progress...</div>
      </div>
    </div>
  );
}

// Progress Step Component
function ProgressStep({
  label,
  done,
  current,
}: {
  label: string;
  done: boolean;
  current: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          done
            ? 'bg-green-500'
            : current
            ? 'bg-cyan-500 animate-pulse'
            : 'bg-gray-700'
        }`}
      >
        {done && (
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {current && <div className="w-2 h-2 bg-black rounded-full" />}
      </div>
      <span className={done ? 'text-green-400' : current ? 'text-cyan-400' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  );
}

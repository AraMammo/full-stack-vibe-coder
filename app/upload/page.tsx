/**
 * Enhanced Voice Upload Page
 *
 * Allows users to record and submit voice notes about their business ideas
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  // Recording timer
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (!audioBlob) {
        setRecordingDuration(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording, audioBlob]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      setError('No recording found. Please record your voice note first.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-note-${Date.now()}.webm`);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    try {
      const response = await fetch('/api/upload-voice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to dashboard or start workflow execution
        const workflowId = data.data?.workflowId;

        if (workflowId) {
          // Optionally trigger workflow execution automatically
          await fetch(`/api/workflow/${workflowId}/execute`, {
            method: 'POST',
          }).catch(err => {
            console.error('Failed to trigger workflow:', err);
            // Non-blocking error - workflow can be triggered later
          });
        }

        router.push('/dashboard');
      } else {
        setError(data.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
              <p className="mt-1 text-sm text-gray-600">
                Tell us about your idea
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            How to record your voice note
          </h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="font-medium">Talk for 3 seconds to 15 minutes about:</p>
            <ul className="space-y-1.5 ml-4">
              <li>• <strong>What problem</strong> does your business solve?</li>
              <li>• <strong>Who</strong> is your target customer?</li>
              <li>• <strong>What makes it unique</strong> or better than alternatives?</li>
              <li>• Any technical requirements or platform preferences</li>
              <li>• Branding ideas (colors, style, inspiration)</li>
              <li>• Budget and timeline expectations</li>
            </ul>
            <p className="mt-3 text-xs text-blue-700">
              💡 Tip: Speak naturally like you're explaining it to a friend. The more detail you provide, the better our AI can tailor the proposal.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Recorder */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
          {/* Not Recording - Initial State */}
          {!recording && !audioBlob && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-900 mb-6 hover:bg-gray-800 transition-colors cursor-pointer group"
                onClick={startRecording}
              >
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to record
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Click the microphone to start recording
              </p>
              <button
                onClick={startRecording}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                🎤 Start Recording
              </button>
            </div>
          )}

          {/* Recording in Progress */}
          {recording && (
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute w-24 h-24 rounded-full bg-red-500 opacity-20 animate-ping" />
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-600">
                  <div className="w-6 h-6 rounded-sm bg-white" />
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Recording...
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-6">
                {formatDuration(recordingDuration)}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Speak clearly about your business idea
              </p>
              <button
                onClick={stopRecording}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                ⏹ Stop Recording
              </button>
            </div>
          )}

          {/* Recording Complete */}
          {audioBlob && !recording && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Recording Complete!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Duration: {formatDuration(recordingDuration)}
              </p>

              {/* Audio Player */}
              <div className="mb-6">
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full max-w-md mx-auto"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>✓ Submit & Generate Proposal</>
                  )}
                </button>

                <button
                  onClick={() => {
                    setAudioBlob(null);
                    setRecordingDuration(0);
                    setError(null);
                  }}
                  disabled={uploading}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 Re-record
                </button>
              </div>
            </div>
          )}
        </div>

        {/* What Happens Next */}
        <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">What happens next?</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center mr-3">1</span>
              <span>Your voice note is transcribed using AI</span>
            </li>
            <li className="flex">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center mr-3">2</span>
              <span>Our AI agents analyze your requirements and create a detailed project scope</span>
            </li>
            <li className="flex">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center mr-3">3</span>
              <span>You receive a complete proposal with timeline and pricing (usually within 2-3 minutes)</span>
            </li>
            <li className="flex">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center mr-3">4</span>
              <span>Review, approve, or request revisions</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}

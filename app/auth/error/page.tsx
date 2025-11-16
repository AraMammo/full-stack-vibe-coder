/**
 * Authentication Error Page
 *
 * Displays helpful error messages when authentication fails
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string; action: string }> = {
    Configuration: {
      title: 'Server Configuration Error',
      description: 'There is a problem with the server configuration. Please contact support.',
      action: 'Contact support if this persists',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to sign in.',
      action: 'Please contact support if you believe this is an error',
    },
    Verification: {
      title: 'Verification Failed',
      description: 'The verification link is invalid or has expired.',
      action: 'Request a new verification link',
    },
    OAuthSignin: {
      title: 'OAuth Sign-in Error',
      description: 'Error connecting to the authentication provider.',
      action: 'Try signing in again',
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description: 'Error during the authentication callback.',
      action: 'Clear your cookies and try again',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Failed',
      description: 'Could not create your account with this provider.',
      action: 'Try a different authentication method',
    },
    EmailCreateAccount: {
      title: 'Email Account Creation Failed',
      description: 'Could not create your account with this email.',
      action: 'Try using Google sign-in instead',
    },
    Callback: {
      title: 'Callback Error',
      description: 'Error during sign-in callback.',
      action: 'Clear your browser cookies and try again',
    },
    OAuthAccountNotLinked: {
      title: 'Account Already Exists',
      description: 'This email is already associated with another account. Please sign in using your original method.',
      action: 'Try signing in with your original provider',
    },
    SessionRequired: {
      title: 'Session Required',
      description: 'You need to be signed in to access this page.',
      action: 'Sign in to continue',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during sign-in.',
      action: 'Try signing in again',
    },
  };

  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {errorInfo.title}
          </h1>

          {/* Error Description */}
          <p className="text-gray-400 text-center mb-6">
            {errorInfo.description}
          </p>

          {/* Error Code */}
          {error && (
            <div className="mb-6 p-3 bg-black/50 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Error Code:</p>
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          {/* Action Message */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm text-center">
              {errorInfo.action}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="block w-full text-center py-3 px-4 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 font-semibold rounded-lg transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Still having issues?{' '}
              <Link
                href="/contact"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Debug Info:</p>
            <pre className="text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(
                {
                  error,
                  timestamp: new Date().toISOString(),
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
      <ErrorContent />
    </Suspense>
  );
}

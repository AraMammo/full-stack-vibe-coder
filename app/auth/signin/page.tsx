/**
 * Sign In Page
 *
 * Google OAuth + Email magic link authentication page
 */

'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="w-8 h-8 border-2 border-accent-2 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailSending(true);
    try {
      await signIn('email', { email, callbackUrl, redirect: false });
      setEmailSent(true);
    } catch (error) {
      console.error('Email sign-in error:', error);
    } finally {
      setEmailSending(false);
    }
  };

  // Context-aware subtitle
  const getSubtitle = () => {
    if (callbackUrl.includes('/dashboard')) {
      return 'Sign in to access your dashboard';
    }
    if (callbackUrl.includes('checkout') || callbackUrl.includes('get-started')) {
      return 'Sign in to start your build';
    }
    return 'Sign in to access your dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-accent/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #FF5C35 0%, #FF5C35 25%, #00C4A0 75%, #00C4A0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Full Stack Vibe Coder
            </h1>
            <p className="text-fsvc-text-secondary text-sm">
              {getSubtitle()}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">
                {error === 'OAuthSignin' && 'Error connecting to Google. Please try again.'}
                {error === 'OAuthCallback' && 'Error during sign-in. Please try again.'}
                {error === 'OAuthCreateAccount' && 'Could not create user account. Please try again.'}
                {error === 'EmailCreateAccount' && 'Could not create user account. Please try again.'}
                {error === 'Callback' && 'Error during sign-in. Please try again.'}
                {error === 'Default' && 'An unexpected error occurred. Please try again.'}
                {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'Default'].includes(error) &&
                  'An error occurred during sign-in. Please try again.'}
              </p>
            </div>
          )}

          {/* Sign-in Options */}
          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {/* Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>

              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in with Google'
              )}
            </button>

            {/* Or Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-base text-fsvc-text-disabled">or</span>
              </div>
            </div>

            {/* Email Sign-In */}
            {emailSent ? (
              <div className="p-4 bg-accent-2/10 border border-accent-2/30 rounded-lg text-center">
                <svg className="w-8 h-8 text-accent-2 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-white font-medium text-sm mb-1">Check your email</p>
                <p className="text-fsvc-text-secondary text-xs mb-3">
                  We sent a sign-in link to <span className="text-white">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setEmailSent(false); setEmail(''); }}
                  className="text-xs text-accent-2 hover:text-accent-2/80 underline underline-offset-2"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"
                />
                <button
                  type="submit"
                  disabled={emailSending || !email}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {emailSending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending link...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Continue with email
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Privacy Notice */}
            <div className="text-center pt-2">
              <p className="text-xs text-fsvc-text-disabled leading-relaxed">
                By signing in, you agree to our{' '}
                <Link href="/terms-of-service" className="text-accent-2 hover:text-accent-2/80 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="text-accent-2 hover:text-accent-2/80 underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-fsvc-text-secondary hover:text-fsvc-text-secondary/80 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>

        {/* Why Sign In */}
        <div className="mt-8 text-center">
          <p className="text-fsvc-text-disabled text-sm mb-3">Why sign in?</p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-surface border border-border flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs text-fsvc-text-secondary">Track<br/>Projects</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-surface border border-border flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <p className="text-xs text-fsvc-text-secondary">Download<br/>Anytime</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-surface border border-border flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-xs text-fsvc-text-secondary">Payment<br/>History</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

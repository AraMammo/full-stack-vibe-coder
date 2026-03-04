/**
 * Email Verification Page
 *
 * Shown after a user submits their email for magic link sign-in.
 */

import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl p-8 shadow-2xl text-center">
          {/* Envelope Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Check your email
          </h1>

          <p className="text-gray-400 text-sm mb-6">
            We sent a sign-in link to your email address. Click the link to continue.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500">
              Didn&apos;t get it? Check your spam folder, or try again with a different email.
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            &larr; Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

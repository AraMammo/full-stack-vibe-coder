/**
 * Sign In Button Component
 *
 * Redirects to sign-in with proper callbackUrl to return to current page
 */

'use client';

import { signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface SignInButtonProps {
  children?: React.ReactNode;
  className?: string;
  provider?: 'google' | 'email';
}

export default function SignInButton({
  children,
  className = 'px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200',
  provider = 'google',
}: SignInButtonProps) {
  const pathname = usePathname();

  const handleSignIn = () => {
    // Include current path as callbackUrl so user returns here after sign-in
    const callbackUrl = pathname || '/dashboard';
    signIn(provider, { callbackUrl });
  };

  return (
    <button onClick={handleSignIn} className={className}>
      {children || 'Sign In'}
    </button>
  );
}

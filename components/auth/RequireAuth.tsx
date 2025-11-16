/**
 * Require Authentication Component
 *
 * Protects pages that require authentication and redirects to sign-in
 * with proper callbackUrl to return to the requested page after sign-in
 */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RequireAuthProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export default function RequireAuth({ children, loadingComponent }: RequireAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to sign-in with callbackUrl to return here after authentication
      const callbackUrl = encodeURIComponent(pathname || '/dashboard');
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <>
        {loadingComponent || (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Session Provider Wrapper
 *
 * Client-side wrapper for NextAuth SessionProvider.
 * Required because SessionProvider must be a client component.
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

/**
 * NextAuth.js v4 Configuration
 *
 * Handles user authentication using email magic links and Google OAuth.
 */

import { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './db';

// Log authentication configuration on startup
const hasEmailProvider =
  !!process.env.EMAIL_SERVER_HOST &&
  !!process.env.EMAIL_SERVER_USER &&
  !!process.env.EMAIL_SERVER_PASSWORD;

const hasGoogleProvider =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

console.log('[NextAuth] Configuration:');
console.log(`  - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ Not set (will auto-detect)'}`);
console.log(`  - NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`  - Email Provider: ${hasEmailProvider ? '✅ Enabled' : '⚠️  Disabled (SMTP not configured)'}`);
console.log(`  - Google OAuth: ${hasGoogleProvider ? '✅ Enabled' : '⚠️  Disabled (OAuth not configured)'}`);

if (!hasEmailProvider && !hasGoogleProvider) {
  console.warn('[NextAuth] ⚠️  WARNING: No authentication providers configured!');
  console.warn('[NextAuth] Users will not be able to sign in.');
  console.warn('[NextAuth] Configure either Email (SMTP) or Google OAuth in environment variables.');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

  // Cookie settings - use 'lax' for better compatibility
  // Only use 'none' if you need cross-site authentication (e.g., embedded iframes)
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Changed from 'none' for better browser compatibility
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
  },

  providers: [
    // Email magic link authentication (optional - requires SMTP configuration)
    ...(hasEmailProvider
      ? [
          EmailProvider({
            server: {
              host: process.env.EMAIL_SERVER_HOST!,
              port: parseInt(process.env.EMAIL_SERVER_PORT ?? '587'),
              auth: {
                user: process.env.EMAIL_SERVER_USER!,
                pass: process.env.EMAIL_SERVER_PASSWORD!,
              },
            },
            from: process.env.EMAIL_FROM ?? 'noreply@fullstackvibecoder.com',
          }),
        ]
      : []),

    // Google OAuth (optional)
    ...(hasGoogleProvider
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'database', // Use database sessions with PrismaAdapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Always allow sign-in for both new and returning users
      console.log('[NextAuth] Sign-in attempt:', {
        email: user?.email,
        provider: account?.provider,
        userId: user?.id,
      });
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Handle callbackUrl redirects properly
      console.log('[NextAuth] Redirect:', { url, baseUrl });

      // If url is relative, prepend baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If url is from the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },

    async session({ session, user }) {
      // Add user ID to session (database strategy provides user, not token)
      if (session.user && user?.id) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      console.log('New user created:', user.email);

      // TODO: Send welcome email
      // TODO: Track user creation in analytics
    },

    async signIn({ user, account, isNewUser }) {
      console.log('User signed in:', {
        email: user?.email,
        provider: account?.provider,
        isNewUser,
      });

      // TODO: Track sign-in event
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * Helper function to get user from database with full details
 * TODO: User model doesn't exist in schema - uncomment when added
 */
export async function getUserWithDetails(userId: string) {
  throw new Error('User model not implemented in schema');
  /*
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      voiceNotes: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      workflows: {
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: {
          proposal: true,
        },
      },
    },
  });
  */
}

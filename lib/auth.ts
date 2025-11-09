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

  // Cookie settings for production deployment
  // Keep sameSite: 'none' for Replit proxy compatibility
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'none',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
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

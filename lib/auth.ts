/**
 * NextAuth.js v5 Configuration
 *
 * Handles user authentication using email magic links and Google OAuth.
 */

import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Email from 'next-auth/providers/email';
import Google from 'next-auth/providers/google';
import { prisma } from './db';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-in-production',

  providers: [
    // Email magic link authentication
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT ?? '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? 'noreply@fullstackvibecoder.com',
    }),

    // Google OAuth (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Helper function to get the current user from server components
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Helper function to require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Helper function to get user from database with full details
 */
export async function getUserWithDetails(userId: string) {
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
}

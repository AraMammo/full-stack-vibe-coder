import type { Metadata, Viewport } from 'next';
import { SessionProvider } from './providers/SessionProvider';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer';
import { CookieConsentBanner } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibe Coding | AI-Powered Development by FullStackVibeCoder',
  description: 'What is vibe coding? The future of software development. Build production-ready applications 10x faster with AI-powered code generation. Vibe coding combines natural language prompts with expert development. Business in a Box: From idea to live website in under 30 minutes.',
  keywords: [
    'vibe coding',
    'what is vibe coding',
    'AI code generation',
    'AI-powered development',
    'rapid application development',
    'business in a box',
    'AI software development',
    'code generation AI',
    'full stack development',
    'TypeScript development',
    'React development',
    'Next.js development',
    'AI development agency',
    'custom software development',
    'business automation',
    'MVP development',
    'startup development',
    'Toronto development agency'
  ],
  authors: [{ name: 'FullStackVibeCoder', url: 'https://fullstackvibecoder.com' }],
  creator: 'FullStackVibeCoder',
  publisher: 'FullStackVibeCoder',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fullstackvibecoder.com',
    title: 'Vibe Coding | AI-Powered Development',
    description: 'The future of software development. Build production-ready applications 10x faster with vibe coding—AI-powered code generation combined with human expertise.',
    siteName: 'FullStackVibeCoder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FullStackVibeCoder - Vibe Coding AI Development',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe Coding | AI-Powered Development',
    description: 'Build production-ready applications 10x faster with vibe coding. From business idea to live website in under 30 minutes.',
    images: ['/og-image.png'],
    creator: '@fullstackvibecoder',
  },
  alternates: {
    canonical: 'https://fullstackvibecoder.com',
  },
};

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#000000',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen flex flex-col bg-black">
        <SessionProvider>
          <Navigation />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <Footer />

          <CookieConsentBanner />
        </SessionProvider>
      </body>
    </html>
  );
}

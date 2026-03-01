import type { Metadata, Viewport } from 'next';
import { SessionProvider } from './providers/SessionProvider';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer';
import { CookieConsentBanner } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShipKit | From Idea to Live Business in 30 Minutes',
  description: 'ShipKit turns your business idea into a complete, launch-ready package: branding, strategy, and a full deployable Next.js codebase — all from a single voice note or chat message.',
  keywords: [
    'shipkit',
    'AI business generator',
    'startup toolkit',
    'ship kit',
    'AI code generation',
    'Next.js codebase generator',
    'brand identity AI',
    'business plan AI',
    'MVP development',
    'startup launch',
    'AI-powered development',
  ],
  authors: [{ name: 'ShipKit', url: 'https://shipkit.io' }],
  creator: 'ShipKit',
  publisher: 'ShipKit',
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
    url: 'https://shipkit.io',
    title: 'ShipKit | From Idea to Live Business in 30 Minutes',
    description: 'Turn your business idea into a complete launch-ready package: branding, strategy, and a full deployable Next.js codebase — all from a single voice note.',
    siteName: 'ShipKit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShipKit - From Idea to Live Business',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipKit | From Idea to Live Business in 30 Minutes',
    description: 'Turn your business idea into a complete launch-ready package. Branding, strategy, and deployable code — all from a single voice note.',
    images: ['/og-image.png'],
    creator: '@shipkit',
  },
  alternates: {
    canonical: 'https://shipkit.io',
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

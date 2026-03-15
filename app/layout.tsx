import type { Metadata, Viewport } from 'next';
import { SessionProvider } from './providers/SessionProvider';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer';
import { CookieConsentBanner } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'Full Stack Vibe Coder | Your Website, Built and Deployed',
  description: 'Describe your business, get a complete website — database, auth, payments, booking — deployed and live. Real code you own. $497.',
  keywords: [
    'full stack vibe coder',
    'AI website builder',
    'website for coaches',
    'website for service businesses',
    'AI code generation',
    'Next.js website builder',
    'custom website cheap',
    'alternative to agencies',
    'own your code',
    'vibe coding',
  ],
  authors: [{ name: 'Full Stack Vibe Coder', url: 'https://fullstackvibecoder.com' }],
  creator: 'Full Stack Vibe Coder',
  publisher: 'Full Stack Vibe Coder',
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
    title: 'Full Stack Vibe Coder | Your Website, Built and Deployed',
    description: 'Describe your business, get a complete website — database, auth, payments, booking — deployed and live. Real code you own. $497.',
    siteName: 'Full Stack Vibe Coder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Full Stack Vibe Coder — Your Website, Built and Deployed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Full Stack Vibe Coder | Your Website, Built and Deployed',
    description: 'Describe your business, get a complete website. Real code, real infrastructure, real ownership. $497.',
    images: ['/og-image.png'],
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
    themeColor: '#0A0A0A',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-base text-fsvc-text font-body">
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

import type { Metadata } from 'next';
import { SessionProvider } from './providers/SessionProvider';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CookieConsentBanner } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'FullStackVibeCoder - AI-Powered Development',
  description: 'Turn business ideas into production-ready software. Voice-to-proposal AI platform for rapid development.',
  keywords: ['AI development', 'software development', 'full stack', 'rapid development', 'business automation'],
  authors: [{ name: 'FullStackVibeCoder' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#111827', // gray-900
  manifest: '/manifest.json',
};

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
      <body className="min-h-screen flex flex-col bg-white">
        {/* Skip to main content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>

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

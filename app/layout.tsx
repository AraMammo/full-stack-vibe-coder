import type { Metadata, Viewport } from 'next';
import { SessionProvider } from './providers/SessionProvider';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer';
import { CookieConsentBanner } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'FullStackVibeCoder - AI-Powered Development',
  description: 'Turn business ideas into production-ready software. Voice-to-proposal AI platform for rapid development.',
  keywords: ['AI development', 'software development', 'full stack', 'rapid development', 'business automation'],
  authors: [{ name: 'FullStackVibeCoder' }],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
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

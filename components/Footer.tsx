/**
 * Site Footer Component
 *
 * Includes legal links, cookie settings, and copyright.
 * WCAG 2.1 AA compliant.
 */

'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleCookieSettings = () => {
    // Trigger cookie consent banner to reopen
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cookie-consent');
      window.location.reload();
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-6" aria-label="Footer navigation">
          <Link
            href="/privacy-policy"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
          >
            Terms of Service
          </Link>
          <Link
            href="/cookie-policy"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
          >
            Cookie Policy
          </Link>
          <button
            type="button"
            onClick={handleCookieSettings}
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded underline"
          >
            Cookie Settings
          </button>
        </nav>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            &copy; {currentYear} FullStackVibeCoder. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}

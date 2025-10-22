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
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <nav className="footer-nav" aria-label="Footer navigation">
          <Link href="/privacy-policy" className="footer-link">
            Privacy Policy
          </Link>
          <span className="footer-separator">|</span>
          <Link href="/terms-of-service" className="footer-link">
            Terms of Service
          </Link>
          <span className="footer-separator">|</span>
          <Link href="/cookie-policy" className="footer-link">
            Cookie Policy
          </Link>
          <span className="footer-separator">|</span>
          <button
            type="button"
            onClick={handleCookieSettings}
            className="footer-link footer-button"
          >
            Cookie Settings
          </button>
        </nav>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} FullStackVibeCoder. All rights reserved.
          </p>
          <p className="footer-tech">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>

        <div className="footer-cookie-notice">
          <p>We use strictly necessary cookies to make our site work. We'd also like to set optional analytics cookies to help us improve it. We won't set optional cookies unless you enable them.</p>
          <p>Learn more in our <Link href="/cookie-policy" className="footer-link-inline">Cookie Policy</Link></p>
          <div className="cookie-buttons">
            <button onClick={handleCookieSettings} className="cookie-btn customize">Customize</button>
            <button className="cookie-btn reject">Reject Optional</button>
            <button className="cookie-btn accept">Accept All</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

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
        {/* SEO-Rich Content Section */}
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-heading">Vibe Coding</h3>
            <p className="footer-description">
              The future of software development. Vibe coding combines AI-powered code generation
              with human expertise to build production-ready applications 10x faster than traditional development.
            </p>
            <p className="footer-description">
              What is vibe coding? It's describing what you want in natural language and getting working code—TypeScript,
              React, Python, full-stack applications—instantly. Not no-code templates. Real, custom code you own.
            </p>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Services</h3>
            <ul className="footer-links">
              <li><Link href="/get-started" className="footer-link-item">Market-Ready Business</Link></li>
              <li><Link href="/what-is-vibe-coding" className="footer-link-item">What is Vibe Coding?</Link></li>
              <li><Link href="/tools" className="footer-link-item">Automation Tools</Link></li>
              <li><Link href="/contact" className="footer-link-item">Custom Development</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              <li><Link href="/faq" className="footer-link-item">FAQ</Link></li>
              <li><Link href="/blog/what-is-vibe-coding" className="footer-link-item">Vibe Coding Guide</Link></li>
              <li><Link href="/get-started" className="footer-link-item">Get Started</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Company</h3>
            <p className="footer-description">
              <strong>FullStackVibeCoder</strong> - AI-powered development agency specializing in vibe coding.
              We turn business ideas into production-ready software in under 30 minutes.
            </p>
            <p className="footer-description">
              From Toronto to worldwide. Building the future of rapid application development.
            </p>
          </div>
        </div>

        {/* Legal Navigation */}
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
            Built with vibe coding | Next.js | TypeScript | AI-Powered Development
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

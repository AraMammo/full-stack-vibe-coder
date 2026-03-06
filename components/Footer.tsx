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
            <h3 className="footer-heading">ShipKit</h3>
            <p className="footer-description">
              From idea to live business in 30 minutes. ShipKit turns your business concept into a complete
              launch-ready package: branding, strategy, and a full deployable Next.js codebase.
            </p>
            <p className="footer-description">
              All from a single voice note or chat message. Not templates — real, custom code and strategy you own.
            </p>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Product</h3>
            <ul className="footer-links">
              <li><Link href="/get-started" className="footer-link-item">Build My App — $497</Link></li>
              <li><Link href="/" className="footer-link-item">Free Preview</Link></li>
              <li><Link href="/get-started" className="footer-link-item">Pricing</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              <li><Link href="/faq" className="footer-link-item">FAQ</Link></li>
              <li><Link href="/blog" className="footer-link-item">Blog</Link></li>
              <li><Link href="/contact" className="footer-link-item">Contact</Link></li>
              <li><Link href="/get-started" className="footer-link-item">Get Started</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Company</h3>
            <p className="footer-description">
              <strong>ShipKit</strong> by <a href="https://bottlenecklabs.ai" target="_blank" rel="noopener noreferrer" className="footer-link-item">BottleneckLabs.ai</a> — AI-powered business launch platform.
              We turn business ideas into complete, deployable products in under 30 minutes.
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
            &copy; {currentYear} ShipKit. All rights reserved.
          </p>
          <p className="footer-tech">
            A <a href="https://bottlenecklabs.ai" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ textDecoration: 'underline' }}>BottleneckLabs.ai</a> product
          </p>
        </div>
      </div>
    </footer>
  );
}

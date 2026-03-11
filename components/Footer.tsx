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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cookie-consent');
      window.location.reload();
    }
  };

  return (
    <footer className="border-t border-border bg-base" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="font-heading text-sm font-light tracking-wide text-fsvc-text">Full Stack</span>
              <span className="font-heading text-sm font-bold tracking-tight text-accent">Vibe Coder</span>
            </div>
            <p className="text-body-sm text-fsvc-text-secondary leading-relaxed">
              Describe your business, get a complete website — database, auth, payments, booking — deployed and live. Real code you own.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-caption font-semibold uppercase tracking-widest text-fsvc-text-secondary mb-3">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/get-started" className="text-body-sm text-fsvc-text-secondary hover:text-accent transition-colors">Get Started</Link></li>
              <li><Link href="/get-started" className="text-body-sm text-fsvc-text-secondary hover:text-accent transition-colors">Pricing</Link></li>
              <li><Link href="/blog" className="text-body-sm text-fsvc-text-secondary hover:text-accent transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-caption font-semibold uppercase tracking-widest text-fsvc-text-secondary mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-body-sm text-fsvc-text-secondary hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="text-body-sm text-fsvc-text-secondary hover:text-accent transition-colors">Contact</Link></li>
              <li><Link href="/about" className="text-body-sm text-fsvc-text-secondary hover:text-accent transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-caption font-semibold uppercase tracking-widest text-fsvc-text-secondary mb-3">Company</h3>
            <p className="text-body-sm text-fsvc-text-secondary leading-relaxed">
              A <a href="https://bottlenecklabs.ai" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">BottleneckLabs.ai</a> product.
            </p>
          </div>
        </div>

        {/* Legal */}
        <nav className="flex flex-wrap items-center gap-4 text-caption text-fsvc-text-disabled border-t border-border pt-6 mb-4" aria-label="Footer navigation">
          <Link href="/privacy-policy" className="hover:text-fsvc-text-secondary transition-colors">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-fsvc-text-secondary transition-colors">Terms of Service</Link>
          <Link href="/cookie-policy" className="hover:text-fsvc-text-secondary transition-colors">Cookie Policy</Link>
          <button type="button" onClick={handleCookieSettings} className="hover:text-fsvc-text-secondary transition-colors cursor-pointer">
            Cookie Settings
          </button>
        </nav>

        <p className="text-caption text-fsvc-text-disabled">
          &copy; {currentYear} Full Stack Vibe Coder. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

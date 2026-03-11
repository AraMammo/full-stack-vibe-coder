/**
 * Main Navigation Component
 *
 * Minimal top bar with hamburger menu that opens side navigation.
 * Works on all screen sizes - unified experience.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SideMenu } from './SideMenu';

export interface NavItem {
  label: string;
  href: string;
  isContact?: boolean;
}

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => { setIsVisible(true); }, []);
  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-accent focus:text-base focus:font-medium focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-base"
      >
        Skip to main content
      </a>

      <nav
        className={`
          fixed top-0 left-0 right-0 z-[999999]
          bg-base/90 backdrop-blur-xl
          border-b border-border
          transition-all duration-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
        aria-label="Main navigation"
      >
        <div className="max-w-[2560px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative w-11 h-11 flex flex-col items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-border hover:border-accent/50 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base group"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="side-menu"
            >
              <span className={`block h-0.5 w-5 bg-accent rounded transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-5 bg-accent rounded transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-accent rounded transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>

            {/* Wordmark */}
            <Link
              href="/"
              className="flex items-baseline gap-1.5 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base rounded-md"
            >
              <span className="font-heading text-lg font-light tracking-wide text-fsvc-text transition-transform group-hover:scale-105">
                Full Stack
              </span>
              <span className="font-heading text-lg font-bold tracking-tight gradient-text transition-transform group-hover:scale-105">
                Vibe Coder
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {[
                { label: 'Pricing', href: '/get-started' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium font-body transition-colors ${
                    pathname === link.href
                      ? 'text-fsvc-text'
                      : 'text-fsvc-text-secondary hover:text-fsvc-text'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Sign In / Dashboard */}
            {status !== 'loading' && (
              <Link
                href={session ? '/dashboard' : '/auth/signin'}
                className={`px-4 py-2 text-sm font-medium font-body rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base ${
                  session
                    ? 'gradient-bg text-white hover:opacity-90'
                    : 'border border-border hover:border-fsvc-text-disabled bg-white/5 hover:bg-white/10 text-fsvc-text'
                }`}
              >
                {session ? 'Dashboard' : 'Sign In'}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentPath={pathname}
        isAuthenticated={!!session}
        authLoading={status === 'loading'}
      />
    </>
  );
}

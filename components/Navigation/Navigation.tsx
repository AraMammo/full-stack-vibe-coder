/**
 * Main Navigation Component
 *
 * Minimal top bar with hamburger menu that opens side navigation.
 * Works on all screen sizes - unified experience.
 * Part of UX overhaul for cleaner navigation and more screen real estate.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
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

  // Entrance animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-gradient-to-r focus:from-pink-500 focus:to-cyan-500 focus:text-white focus:font-medium focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
      >
        Skip to main content
      </a>

      <nav
        className={`
          fixed top-0 left-0 right-0 z-[999999]
          bg-black/90 backdrop-blur-xl
          border-b border-pink-500/30
          transition-all duration-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
        aria-label="Main navigation"
      >
        <div className="max-w-[2560px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu - Left Side */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative w-11 h-11 flex flex-col items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black group"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="side-menu"
            >
              {/* Animated Hamburger Icon */}
              <span
                className={`block h-0.5 w-5 bg-gradient-to-r from-pink-500 to-cyan-500 rounded transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-gradient-to-r from-pink-500 to-cyan-500 rounded transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-gradient-to-r from-pink-500 to-cyan-500 rounded transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </button>

            {/* Logo - Center */}
            <Link
              href="/"
              className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black rounded-lg absolute left-1/2 -translate-x-1/2"
            >
              <Image
                src="/logo.svg"
                alt="FullStack Vibe Coder Logo"
                width={40}
                height={40}
                className="transition-transform group-hover:scale-110"
                priority
              />
              <span
                className="hidden sm:block text-lg md:text-xl font-bold tracking-tight uppercase transition-transform group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Fullstack Vibe Coder
              </span>
            </Link>

            {/* Sign In / Dashboard - Right Side */}
            {status !== 'loading' && (
              <Link
                href={session ? '/dashboard' : '/auth/signin'}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-white/20 hover:border-pink-500/50 bg-white/5 hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black"
                style={{
                  background: session ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(6, 182, 212, 0.1))' : undefined,
                }}
              >
                <span className="text-white">
                  {session ? 'Dashboard' : 'Sign In'}
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Side Menu */}
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

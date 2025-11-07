/**
 * Main Navigation Component
 *
 * Horizontal navigation bar with cyberpunk aesthetic.
 * Glass morphism effect with pink/cyan accents.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NavLink } from './NavLink';
import { MobileMenu } from './MobileMenu';

export interface NavItem {
  label: string;
  href: string;
  isContact?: boolean;
}

const navItems: NavItem[] = [
  { label: 'What is Vibe Coding?', href: '/about' },
  { label: 'Market-Ready Business', href: '/get-started' },
  { label: 'Tools', href: '/tools' },
  { label: 'Contact', href: '/contact', isContact: true },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Entrance animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

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
          bg-black/95 backdrop-blur-xl
          border-b-2 border-pink-500/50
          transition-all duration-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
        aria-label="Main navigation"
      >
        <div className="max-w-[2560px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <Link
              href="/"
              className="block group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <span className="text-xl md:text-2xl font-bold tracking-tight uppercase transition-transform group-hover:scale-105">
                Fullstack Vibe Coder
              </span>
            </Link>

            {/* Desktop Navigation - Right Side */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isActive={pathname === item.href}
                  isContact={item.isContact || false}
                />
              ))}
            </div>

            {/* Mobile: Hamburger Button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-black/85 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl transition-all duration-300 hover:border-pink-500/50 hover:shadow-pink-500/20 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black group"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {/* Animated Hamburger Icon */}
                <span
                  className={`block h-0.5 w-6 bg-gradient-to-r from-pink-500 to-cyan-500 rounded transition-all duration-300 ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-gradient-to-r from-pink-500 to-cyan-500 rounded transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-gradient-to-r from-pink-500 to-cyan-500 rounded transition-all duration-300 ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        currentPath={pathname}
      />
    </>
  );
}

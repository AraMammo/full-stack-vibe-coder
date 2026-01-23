/**
 * SideMenu Component
 *
 * Slide-out navigation drawer from the left.
 * Works on both mobile and desktop for a unified experience.
 * Part of UX overhaul - cleaner navigation, more screen real estate.
 */

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  isAuthenticated: boolean;
  authLoading: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  showWhenAuth?: 'always' | 'authenticated' | 'unauthenticated';
}

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PricingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ToolsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BlogIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const FAQIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const SignInIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <HomeIcon />, showWhenAuth: 'always' },
  { label: 'Pricing', href: '/get-started', icon: <PricingIcon />, showWhenAuth: 'always' },
  { label: 'Tools', href: '/tools', icon: <ToolsIcon />, showWhenAuth: 'always' },
  { label: 'Blog', href: '/blog', icon: <BlogIcon />, showWhenAuth: 'always' },
  { label: 'FAQ', href: '/faq', icon: <FAQIcon />, showWhenAuth: 'always' },
];

export function SideMenu({ isOpen, onClose, currentPath, isAuthenticated, authLoading }: SideMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Focus first link when menu opens
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      setTimeout(() => firstLinkRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const shouldShowItem = (item: NavItem) => {
    if (authLoading) return item.showWhenAuth === 'always';
    if (item.showWhenAuth === 'authenticated') return isAuthenticated;
    if (item.showWhenAuth === 'unauthenticated') return !isAuthenticated;
    return true;
  };

  return (
    <div
      className="fixed inset-0 z-[999998]"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Drawer - slides from LEFT */}
      <div
        ref={drawerRef}
        id="side-menu"
        className="absolute top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-black/95 backdrop-blur-xl border-r border-pink-500/30 shadow-[8px_0_32px_rgba(0,0,0,0.6)]"
        style={{ animation: 'slideInLeft 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <span
            className="text-lg font-bold tracking-tight uppercase"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col p-4" aria-label="Main navigation">
          {navItems.filter(shouldShowItem).map((item, index) => {
            const isActive = currentPath === item.href ||
              (item.href !== '/' && currentPath.startsWith(item.href));

            return (
              <Link
                key={item.href}
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30'
                    : 'hover:bg-white/5'
                  }
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black
                `}
                aria-current={isActive ? 'page' : undefined}
                onClick={onClose}
              >
                <span className={isActive ? 'text-pink-400' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span
                  className="font-medium"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }
                      : { color: 'white' }
                  }
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />

          {/* Auth-aware links */}
          {!authLoading && (
            isAuthenticated ? (
              <Link
                href="/dashboard"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${currentPath === '/dashboard' || currentPath.startsWith('/dashboard/')
                    ? 'bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30'
                    : 'hover:bg-white/5'
                  }
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black
                `}
                aria-current={currentPath.startsWith('/dashboard') ? 'page' : undefined}
                onClick={onClose}
              >
                <span className={currentPath.startsWith('/dashboard') ? 'text-pink-400' : 'text-gray-400'}>
                  <DashboardIcon />
                </span>
                <span
                  className="font-medium"
                  style={
                    currentPath.startsWith('/dashboard')
                      ? {
                          background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }
                      : { color: 'white' }
                  }
                >
                  Dashboard
                </span>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${currentPath === '/auth/signin'
                    ? 'bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30'
                    : 'hover:bg-white/5'
                  }
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black
                `}
                aria-current={currentPath === '/auth/signin' ? 'page' : undefined}
                onClick={onClose}
              >
                <span className={currentPath === '/auth/signin' ? 'text-pink-400' : 'text-gray-400'}>
                  <SignInIcon />
                </span>
                <span
                  className="font-medium"
                  style={
                    currentPath === '/auth/signin'
                      ? {
                          background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }
                      : { color: 'white' }
                  }
                >
                  Sign In
                </span>
              </Link>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            FullStack Vibe Coder
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

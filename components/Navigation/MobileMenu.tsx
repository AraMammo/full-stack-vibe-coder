/**
 * MobileMenu Component
 *
 * Slide-in drawer navigation for mobile devices.
 * Full-height drawer from right edge with backdrop overlay.
 */

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { NavItem } from './Navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
  isAuthenticated: boolean;
  authLoading: boolean;
}

export function MobileMenu({ isOpen, onClose, navItems, currentPath, isAuthenticated, authLoading }: MobileMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Focus first link when menu opens
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      firstLinkRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Split regular links and contact link
  const regularLinks = navItems.filter(item => !item.isContact);
  const contactLink = navItems.find(item => item.isContact);

  return (
    <div
      className="fixed inset-0 z-[999] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        id="mobile-menu"
        className={`
          absolute top-0 right-0 bottom-0
          w-[80vw] max-w-[320px]
          bg-black/95 backdrop-blur-xl
          border-l border-white/10
          shadow-[-8px_0_32px_rgba(0,0,0,0.6)]
          animate-slide-in-right
        `}
        style={{
          clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)',
        }}
      >
        {/* Close button */}
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col h-full pt-20 pb-8 px-6" aria-label="Mobile navigation menu">
          {/* Regular Links */}
          <div className="flex flex-col gap-4 flex-1">
            {regularLinks.map((item, index) => {
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.href}
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  className="relative block group focus:outline-none"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onClose}
                >
                  <div className="relative">
                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #ec4899 0%, #06b6d4 100%)',
                          boxShadow: '0 0 12px rgba(236, 72, 153, 0.8)',
                        }}
                      />
                    )}

                    <span
                      className={`
                        block py-3 text-lg font-medium rounded-lg
                        transition-all duration-200
                        group-hover:translate-x-2
                        ${isActive ? 'pl-6' : 'pl-4'}
                      `}
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

                    {/* Focus ring */}
                    <div
                      className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity"
                      style={{
                        boxShadow: '0 0 0 2px black, 0 0 0 4px #ec4899',
                      }}
                    />
                  </div>
                </Link>
              );
            })}

            {/* Auth-aware link */}
            {!authLoading && (
              isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="relative block group focus:outline-none"
                  aria-current={currentPath === '/dashboard' ? 'page' : undefined}
                  onClick={onClose}
                >
                  <div className="relative">
                    {currentPath === '/dashboard' && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #ec4899 0%, #06b6d4 100%)',
                          boxShadow: '0 0 12px rgba(236, 72, 153, 0.8)',
                        }}
                      />
                    )}

                    <span
                      className={`
                        block py-3 text-lg font-medium rounded-lg
                        transition-all duration-200
                        group-hover:translate-x-2
                        ${currentPath === '/dashboard' ? 'pl-6' : 'pl-4'}
                      `}
                      style={
                        currentPath === '/dashboard'
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

                    <div
                      className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity"
                      style={{
                        boxShadow: '0 0 0 2px black, 0 0 0 4px #ec4899',
                      }}
                    />
                  </div>
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="relative block group focus:outline-none"
                  aria-current={currentPath === '/auth/signin' ? 'page' : undefined}
                  onClick={onClose}
                >
                  <div className="relative">
                    {currentPath === '/auth/signin' && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #ec4899 0%, #06b6d4 100%)',
                          boxShadow: '0 0 12px rgba(236, 72, 153, 0.8)',
                        }}
                      />
                    )}

                    <span
                      className={`
                        block py-3 text-lg font-medium rounded-lg
                        transition-all duration-200
                        group-hover:translate-x-2
                        ${currentPath === '/auth/signin' ? 'pl-6' : 'pl-4'}
                      `}
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

                    <div
                      className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity"
                      style={{
                        boxShadow: '0 0 0 2px black, 0 0 0 4px #ec4899',
                      }}
                    />
                  </div>
                </Link>
              )
            )}
          </div>

          {/* Gradient Divider */}
          {contactLink && (
            <>
              <div
                className="my-6 h-px w-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, #ec4899 25%, #06b6d4 75%, transparent 100%)',
                  boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)',
                }}
              />

              {/* Contact Link (Emphasized) */}
              <Link
                href={contactLink.href}
                className="relative block group focus:outline-none"
                aria-current={currentPath === contactLink.href ? 'page' : undefined}
                onClick={onClose}
              >
                <div
                  className="relative px-6 py-4 rounded-lg border-2 transition-all duration-200"
                  style={{
                    borderImage: 'linear-gradient(135deg, #ec4899, #06b6d4) 1',
                    borderColor: 'transparent',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(6, 182, 212, 0.1))',
                  }}
                >
                  <span
                    className="block text-center text-lg font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {contactLink.label}
                  </span>

                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 rounded-lg opacity-50 blur-xl -z-10 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
                    }}
                  />
                </div>

                {/* Focus ring */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity"
                  style={{
                    boxShadow: '0 0 0 2px black, 0 0 0 4px #ec4899',
                  }}
                />
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

/**
 * NavLink Component
 *
 * Individual navigation link optimized for horizontal navbar display.
 * Handles both regular links and emphasized contact link with cyberpunk styling.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavLinkProps {
  label: string;
  href: string;
  isActive: boolean;
  isContact: boolean;
}

export function NavLink({ label, href, isActive, isContact }: NavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isContact) {
    // Contact Link - Emphasized with gradient border
    return (
      <Link
        href={href}
        className="relative inline-block group focus:outline-none ml-2"
        aria-current={isActive ? 'page' : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`
            relative px-5 py-2.5 rounded-lg
            border-2
            transition-all duration-200
            ${
              isActive || isHovered
                ? 'bg-gradient-to-r from-pink-500/10 to-cyan-500/10 scale-105'
                : 'bg-transparent'
            }
          `}
          style={{
            borderImage: isActive || isHovered
              ? 'linear-gradient(135deg, #ec4899, #06b6d4) 1'
              : 'none',
            borderColor: isActive || isHovered ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <span
            className={`
              block text-sm font-bold whitespace-nowrap
              transition-all duration-200
              ${isActive || isHovered ? '' : 'text-white/90'}
            `}
            style={
              isActive || isHovered
                ? {
                    background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }
                : undefined
            }
          >
            {label}
          </span>

          {/* Glow effect on hover */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-lg opacity-40 blur-xl -z-10"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
              }}
            />
          )}
        </div>

        {/* Focus ring */}
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity"
          style={{
            boxShadow: '0 0 0 2px black, 0 0 0 4px #ec4899',
          }}
        />
      </Link>
    );
  }

  // Regular Link - Horizontal layout optimized
  return (
    <Link
      href={href}
      className="relative inline-flex items-center group focus:outline-none"
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={`
          block px-4 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap
          transition-all duration-200
          ${isActive || isHovered ? 'scale-105' : 'scale-100'}
        `}
        style={
          isActive || isHovered
            ? {
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'brightness(1.2)',
              }
            : { color: 'rgba(255, 255, 255, 0.90)' }
        }
      >
        {label}
      </span>

      {/* Active indicator - bottom border */}
      {isActive && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-3/4 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #ec4899 0%, #06b6d4 100%)',
            boxShadow: '0 0 8px rgba(236, 72, 153, 0.8)',
          }}
        />
      )}

      {/* Hover glow */}
      {isHovered && !isActive && (
        <div
          className="absolute inset-0 rounded-lg opacity-20 blur-lg pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
          }}
        />
      )}

      {/* Focus ring */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity pointer-events-none"
        style={{
          boxShadow: '0 0 0 2px black, 0 0 0 4px #ec4899',
        }}
      />
    </Link>
  );
}

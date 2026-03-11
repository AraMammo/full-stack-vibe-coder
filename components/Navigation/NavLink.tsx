/**
 * NavLink Component
 *
 * Individual navigation link optimized for horizontal navbar display.
 * Handles both regular links and emphasized contact link with brand styling.
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
    // Contact Link - Emphasized with accent border
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
                ? 'bg-accent/10 scale-105'
                : 'bg-transparent'
            }
          `}
          style={{
            borderColor: isActive || isHovered ? '#FF5C35' : 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <span
            className={`
              block text-sm font-bold whitespace-nowrap
              transition-all duration-200
              ${isActive || isHovered ? 'text-accent' : 'text-white/90'}
            `}
          >
            {label}
          </span>

          {/* Glow effect on hover */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-lg opacity-40 blur-xl -z-10 bg-accent"
            />
          )}
        </div>

        {/* Focus ring */}
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity"
          style={{
            boxShadow: '0 0 0 2px black, 0 0 0 4px #FF5C35',
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
          ${isActive || isHovered ? 'text-accent scale-105' : 'text-white/90 scale-100'}
        `}
      >
        {label}
      </span>

      {/* Active indicator - bottom border */}
      {isActive && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-3/4 rounded-full bg-accent"
          style={{
            boxShadow: '0 0 8px rgba(255, 92, 53, 0.8)',
          }}
        />
      )}

      {/* Hover glow */}
      {isHovered && !isActive && (
        <div
          className="absolute inset-0 rounded-lg opacity-20 blur-lg pointer-events-none bg-accent"
        />
      )}

      {/* Focus ring */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity pointer-events-none"
        style={{
          boxShadow: '0 0 0 2px black, 0 0 0 4px #FF5C35',
        }}
      />
    </Link>
  );
}

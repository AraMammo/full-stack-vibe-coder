/**
 * NavLink Component
 *
 * Individual navigation link with gradient hover states and active indicators.
 * Handles both regular links and emphasized contact link.
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
        className="relative block group focus:outline-none"
        aria-current={isActive ? 'page' : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`
            relative px-4 py-3 rounded-lg
            border-2
            transition-all duration-200
            ${
              isActive || isHovered
                ? 'bg-gradient-to-r from-pink-500/10 to-cyan-500/10'
                : 'bg-transparent'
            }
          `}
          style={{
            borderImage: isActive || isHovered
              ? 'linear-gradient(135deg, #ec4899, #06b6d4) 1'
              : 'none',
            borderColor: isActive || isHovered ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <span
            className={`
              block text-base font-medium
              transition-all duration-200
              ${isActive || isHovered ? '' : 'text-white'}
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
              className="absolute inset-0 rounded-lg opacity-50 blur-xl -z-10"
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

  // Regular Link
  return (
    <Link
      href={href}
      className="relative flex items-center group focus:outline-none"
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active indicator dot */}
      {isActive && (
        <div
          className="absolute left-0 w-1.5 h-4 rounded-full animate-scale-in"
          style={{
            background: 'linear-gradient(180deg, #ec4899 0%, #06b6d4 100%)',
            boxShadow: '0 0 8px rgba(236, 72, 153, 0.8)',
          }}
        />
      )}

      <span
        className={`
          block px-4 py-2 text-base font-medium rounded-lg
          transition-all duration-200
          ${isHovered ? 'translate-x-2' : 'translate-x-0'}
          ${isActive ? 'pl-6' : ''}
        `}
        style={
          isActive || isHovered
            ? {
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }
            : { color: 'white' }
        }
      >
        {label}
      </span>

      {/* Hover glow */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-lg opacity-30 blur-lg pointer-events-none"
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

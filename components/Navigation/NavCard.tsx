/**
 * NavCard Component
 *
 * Floating glass morphism card containing navigation links.
 * Desktop only - positioned in top-right corner.
 */

'use client';

import { NavItem } from './Navigation';
import { NavLink } from './NavLink';

interface NavCardProps {
  navItems: NavItem[];
  currentPath: string;
  isVisible: boolean;
}

export function NavCard({ navItems, currentPath, isVisible }: NavCardProps) {
  // Split regular links and contact link
  const regularLinks = navItems.filter(item => !item.isContact);
  const contactLink = navItems.find(item => item.isContact);

  return (
    <div
      className={`
        w-[280px] lg:w-[300px]
        bg-black/95 backdrop-blur-xl
        border-2 border-pink-500/50
        rounded-xl
        shadow-[0_8px_32px_rgba(236,72,153,0.4),0_8px_32px_rgba(0,0,0,0.8)]
        p-5
        transition-all duration-500 ease-out
        hover:scale-[1.02]
        hover:shadow-[0_12px_48px_rgba(236,72,153,0.5),0_12px_48px_rgba(6,182,212,0.5)]
        hover:border-pink-500/70
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}
      `}
      style={{
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
      }}
    >
      {/* Regular Navigation Links */}
      <div className="flex flex-col gap-3">
        {regularLinks.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            href={item.href}
            isActive={currentPath === item.href}
            isContact={false}
          />
        ))}
      </div>

      {/* Gradient Divider */}
      {contactLink && (
        <>
          <div
            className="my-4 h-px w-[90%] mx-auto rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ec4899 0%, #06b6d4 100%)',
              boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)',
            }}
          />

          {/* Contact Link (Emphasized) */}
          <NavLink
            label={contactLink.label}
            href={contactLink.href}
            isActive={currentPath === contactLink.href}
            isContact={true}
          />
        </>
      )}
    </div>
  );
}

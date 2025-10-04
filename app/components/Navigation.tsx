'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const openForm = (subject: string) => {
    // Create a temporary form element to trigger the contact form
    const event = new CustomEvent('openContactForm', { detail: { subject } });
    window.dispatchEvent(event);
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Business In A Box', path: '/pricing' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo" onClick={() => router.push('/')}>
          <span className="logo-text">FULLSTACK VIBE CODER</span>
        </div>

        {/* Desktop Menu */}
        <div className="nav-menu desktop-menu">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              {item.name}
            </button>
          ))}
          <button
            className="nav-item contact-btn"
            onClick={() => openForm('General Inquiry')}
          >
            Contact
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`mobile-nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => {
              router.push(item.path);
              setIsMenuOpen(false);
            }}
          >
            {item.name}
          </button>
        ))}
        <button
          className="mobile-nav-item contact-btn"
          onClick={() => {
            openForm('General Inquiry');
            setIsMenuOpen(false);
          }}
        >
          Contact
        </button>
      </div>
    </nav>
  );
}

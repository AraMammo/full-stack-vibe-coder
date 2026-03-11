import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base: '#0A0A0A',
        surface: '#111111',
        raised: '#1A1A1A',
        border: '#2A2A2A',
        'fsvc-text': '#F0F0EE',
        'fsvc-text-secondary': '#9A9A96',
        'fsvc-text-disabled': '#555552',
        accent: '#FF5C35',
        'accent-hover': '#FF7A5A',
        'accent-glow': 'rgba(255,92,53,0.12)',
        'accent-2': '#00C4A0',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'h1': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        'h2': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.02em' }],
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.06em' }],
        'code': ['0.8125rem', { lineHeight: '1.7', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '3px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'glow-accent': '0 0 24px rgba(255,92,53,0.18)',
        'glow-sm': '0 0 12px rgba(255,92,53,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

'use client';

import { useState } from 'react';

/**
 * ShowcaseSection — Rich app previews that look like real deployed sites.
 * Each showcase is a realistic browser-chrome mock with actual UI content.
 */

interface ShowcaseApp {
  name: string;
  url: string;
  tagline: string;
  industry: string;
  brandColor: string;
  brandColorLight: string;
  features: string[];
  stats: { label: string; value: string }[];
  preview: React.ReactNode;
}

const showcaseApps: ShowcaseApp[] = [
  {
    name: 'GlowRoute',
    url: 'glowroute.com',
    tagline: 'Smart skincare routines, personalized to your skin',
    industry: 'Health & Beauty SaaS',
    brandColor: '#E879A0',
    brandColorLight: '#FDF2F8',
    features: ['Skin quiz onboarding', 'Subscription plans via Stripe', 'Product recommendations engine', 'Progress photo tracking', 'Admin dashboard'],
    stats: [
      { label: 'Users', value: '2,340' },
      { label: 'MRR', value: '$18.4k' },
      { label: 'Retention', value: '89%' },
    ],
    preview: (
      <div className="bg-white rounded-lg overflow-hidden text-gray-900">
        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full" style={{ background: 'linear-gradient(135deg, #E879A0, #F9A8D4)' }} />
            <span className="font-bold text-sm" style={{ color: '#E879A0' }}>GlowRoute</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>My Routine</span>
            <span>Products</span>
            <span>Progress</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold" style={{ color: '#E879A0' }}>JK</div>
        </div>
        {/* Hero */}
        <div className="px-4 py-6" style={{ background: 'linear-gradient(135deg, #FDF2F8, #FCE7F3)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#E879A0' }}>Good morning, Jessica</p>
          <p className="text-lg font-bold text-gray-900 mb-2">Your Evening Routine</p>
          <div className="flex gap-2">
            {['Cleanser', 'Serum', 'Moisturizer', 'SPF'].map((step, i) => (
              <div key={step} className="flex-1 rounded-lg bg-white/80 p-2 text-center shadow-sm">
                <div className={`w-5 h-5 mx-auto mb-1 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i < 2 ? 'bg-green-400' : 'bg-gray-200'}`}>
                  {i < 2 ? '✓' : (i + 1)}
                </div>
                <p className="text-[10px] text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Progress */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Skin Score</span>
            <span className="text-xs font-bold" style={{ color: '#E879A0' }}>78/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '78%', background: 'linear-gradient(90deg, #E879A0, #F9A8D4)' }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    name: 'VaultBoard',
    url: 'vaultboard.io',
    tagline: 'Client portals for creative agencies',
    industry: 'B2B Platform',
    brandColor: '#6366F1',
    brandColorLight: '#EEF2FF',
    features: ['Multi-tenant workspaces', 'File sharing & approvals', 'Invoice generation', 'Client-facing portal', 'Role-based access control'],
    stats: [
      { label: 'Agencies', value: '180' },
      { label: 'Projects', value: '4,200' },
      { label: 'Files', value: '92k' },
    ],
    preview: (
      <div className="bg-gray-950 rounded-lg overflow-hidden text-white">
        {/* Sidebar + Main */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="w-10 bg-gray-900 py-3 flex flex-col items-center gap-3 border-r border-gray-800">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] font-bold">V</div>
            <div className="w-5 h-5 rounded bg-gray-800" />
            <div className="w-5 h-5 rounded bg-gray-800" />
            <div className="w-5 h-5 rounded bg-indigo-500/20" />
          </div>
          {/* Main content */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400">Workspace</p>
                <p className="text-sm font-bold">Pixel & Co. Agency</p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">Pro Plan</span>
              </div>
            </div>
            {/* Project cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Acme Rebrand', status: 'In Review', color: '#F59E0B' },
                { name: 'Nova Launch', status: 'Active', color: '#22C55E' },
                { name: 'Zenith App', status: 'Draft', color: '#6B7280' },
                { name: 'Bloom Identity', status: 'Approved', color: '#6366F1' },
              ].map((proj) => (
                <div key={proj.name} className="rounded-lg bg-gray-900 border border-gray-800 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium">{proj.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: proj.color + '20', color: proj.color }}>{proj.status}</span>
                </div>
              ))}
            </div>
            {/* Activity */}
            <div className="mt-2 rounded-lg bg-gray-900 border border-gray-800 p-2">
              <p className="text-[10px] text-gray-400 mb-1">Recent Activity</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[8px]">M</div>
                  <span className="text-gray-300">Maya uploaded <span className="text-indigo-400">final_v3.fig</span></span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[8px]">C</div>
                  <span className="text-gray-300">Client approved <span className="text-green-400">Invoice #042</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    name: 'DogDash',
    url: 'dogdash.app',
    tagline: 'Dog walking & pet care, booked in seconds',
    industry: 'Local Services Marketplace',
    brandColor: '#F97316',
    brandColorLight: '#FFF7ED',
    features: ['GPS walk tracking', 'Recurring booking system', 'Pet profiles & medical info', 'In-app messaging', 'Payment & tipping'],
    stats: [
      { label: 'Walks', value: '12,800' },
      { label: 'Walkers', value: '340' },
      { label: 'Avg Rating', value: '4.9' },
    ],
    preview: (
      <div className="bg-white rounded-lg overflow-hidden text-gray-900">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-bold">🐕 DogDash</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">Seattle, WA</span>
          </div>
        </div>
        {/* Active walk */}
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-orange-600">Walk in Progress</p>
              <p className="text-[10px] text-gray-500">Cooper & Bella • with Sarah M.</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-orange-600 font-medium">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              32 min
            </div>
          </div>
          {/* Fake map */}
          <div className="h-20 bg-green-100 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 8px, #86EFAC 8px, #86EFAC 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, #86EFAC 8px, #86EFAC 9px)' }} />
            <svg className="absolute bottom-2 left-4 w-full h-12" viewBox="0 0 200 40" fill="none">
              <path d="M10 30 Q40 5 70 20 Q100 35 130 15 Q160 0 190 25" stroke="#F97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="190" cy="25" r="4" fill="#F97316" />
            </svg>
            <div className="absolute top-1 right-2 bg-white/90 rounded px-1.5 py-0.5 text-[9px] font-medium text-gray-600">1.4 mi</div>
          </div>
        </div>
        {/* Upcoming */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Upcoming</p>
          {[
            { time: '3:00 PM', dog: 'Max', walker: 'Jake R.', type: '30 min walk' },
            { time: '5:30 PM', dog: 'Luna', walker: 'Sarah M.', type: '1 hr walk' },
          ].map((b) => (
            <div key={b.time} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400 w-12">{b.time}</span>
                <div>
                  <p className="text-[11px] font-medium">{b.dog}</p>
                  <p className="text-[9px] text-gray-400">{b.type}</p>
                </div>
              </div>
              <span className="text-[9px] text-orange-500 font-medium">{b.walker}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    name: 'Kettl',
    url: 'kettl.co',
    tagline: 'Specialty tea subscriptions & discovery',
    industry: 'DTC E-Commerce',
    brandColor: '#059669',
    brandColorLight: '#ECFDF5',
    features: ['Subscription box management', 'Flavor profile quiz', 'Brew guides & content', 'Referral rewards program', 'Inventory & fulfillment'],
    stats: [
      { label: 'Subscribers', value: '1,120' },
      { label: 'Teas', value: '64' },
      { label: 'Countries', value: '12' },
    ],
    preview: (
      <div className="bg-stone-50 rounded-lg overflow-hidden text-gray-900">
        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-stone-100">
          <span className="font-bold text-sm tracking-wide" style={{ color: '#059669' }}>kettl</span>
          <div className="flex gap-3 text-[10px] text-stone-500">
            <span>Shop</span>
            <span>Subscribe</span>
            <span>Brew Guide</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]">🛒</span>
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold" style={{ color: '#059669' }}>3</div>
          </div>
        </div>
        {/* Hero product */}
        <div className="px-4 py-4">
          <div className="flex gap-3">
            <div className="w-20 h-24 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' }}>
              <div className="text-center">
                <span className="text-2xl">🍵</span>
                <p className="text-[8px] text-emerald-700 mt-0.5 font-medium">Gyokuro</p>
              </div>
            </div>
            <div className="flex-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">New Arrival</span>
              <p className="text-sm font-bold mt-1">Uji Gyokuro Reserve</p>
              <p className="text-[10px] text-stone-500 mt-0.5">Shade-grown Japanese green tea with deep umami and sweet finish.</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-bold" style={{ color: '#059669' }}>$34</span>
                <span className="text-[10px] text-stone-400 line-through">$42</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Subscriber Price</span>
              </div>
            </div>
          </div>
        </div>
        {/* Subscription box */}
        <div className="mx-4 mb-3 p-3 rounded-lg border-2 border-dashed" style={{ borderColor: '#059669' + '40' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold" style={{ color: '#059669' }}>The Discovery Box</p>
              <p className="text-[9px] text-stone-400">3 curated teas • Ships monthly</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold">$29<span className="text-[9px] text-stone-400 font-normal">/mo</span></p>
              <p className="text-[8px] text-emerald-600">Free shipping</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

function BrowserFrame({ children, url, brandColor }: { children: React.ReactNode; url: string; brandColor: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-lg">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-raised border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 ml-2">
          <div className="bg-base rounded px-2 py-0.5 text-[10px] text-fsvc-text-disabled max-w-[140px] flex items-center gap-1">
            <svg className="w-2.5 h-2.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            {url}
          </div>
        </div>
      </div>
      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

function FeatureTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-raised border border-border text-[10px] text-fsvc-text-secondary">
      {children}
    </span>
  );
}

export default function ShowcaseSection() {
  const [activeApp, setActiveApp] = useState(0);
  const app = showcaseApps[activeApp];

  return (
    <section className="px-4 sm:px-6 py-20 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-center text-fsvc-text-secondary uppercase tracking-wider mb-3">
          What Gets Built
        </h2>
        <p className="text-center text-fsvc-text-disabled mb-10 max-w-2xl mx-auto">
          Real full-stack apps — not templates. Each one gets its own database, auth, payments, and deployment.
        </p>

        {/* App selector tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {showcaseApps.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setActiveApp(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                i === activeApp
                  ? 'bg-surface border border-accent/40 text-fsvc-text shadow-glow-sm'
                  : 'text-fsvc-text-disabled hover:text-fsvc-text-secondary hover:bg-raised'
              }`}
            >
              <span className="hidden sm:inline">{a.name}</span>
              <span className="sm:hidden">{a.name.slice(0, 6)}</span>
              <span className="ml-2 text-[10px] text-fsvc-text-disabled hidden md:inline">{a.industry}</span>
            </button>
          ))}
        </div>

        {/* Showcase detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Browser preview */}
          <div className="order-2 lg:order-1">
            <BrowserFrame url={app.url} brandColor={app.brandColor}>
              {app.preview}
            </BrowserFrame>
          </div>

          {/* Info panel */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: app.brandColor }}>
                {app.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-fsvc-text">{app.name}</h3>
                <p className="text-xs text-fsvc-text-disabled">{app.industry}</p>
              </div>
            </div>

            <p className="text-fsvc-text-secondary mb-4">{app.tagline}</p>

            {/* Stats */}
            <div className="flex gap-4 mb-5">
              {app.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg font-bold text-fsvc-text">{stat.value}</p>
                  <p className="text-[10px] text-fsvc-text-disabled uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-fsvc-text-disabled uppercase tracking-wider mb-2">What&apos;s included</p>
              <div className="space-y-1.5">
                {app.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-fsvc-text-secondary">
                    <span className="text-accent-2 text-xs">&#10003;</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="flex flex-wrap gap-1.5">
              <FeatureTag>Next.js 14</FeatureTag>
              <FeatureTag>PostgreSQL</FeatureTag>
              <FeatureTag>Stripe</FeatureTag>
              <FeatureTag>Auth</FeatureTag>
              <FeatureTag>Vercel</FeatureTag>
              <FeatureTag>Email</FeatureTag>
            </div>
          </div>
        </div>

        {/* Bottom indicator dots */}
        <div className="flex justify-center gap-2 mt-8">
          {showcaseApps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveApp(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeApp ? 'bg-accent w-6' : 'bg-fsvc-text-disabled/30 hover:bg-fsvc-text-disabled/50'
              }`}
              aria-label={`View ${showcaseApps[i].name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

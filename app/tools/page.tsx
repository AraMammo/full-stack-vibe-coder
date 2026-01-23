/**
 * Tools Page - Restructured
 *
 * Clean layout with bundle promotion and organized tool sections.
 * Part of UX overhaul for better conversion.
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice?: number;
  annualPrice?: number;
  lifetimePrice?: number;
  slug: string;
  badge?: string;
  badgeColor?: string;
}

const freeTools: Tool[] = [
  {
    id: 'whiteboard',
    slug: 'whiteboard',
    name: 'Whiteboard',
    description: 'Professional whiteboard for brainstorming and visual collaboration. Sketch ideas, create flowcharts, and export to PNG/SVG.',
    features: [
      'Unlimited canvas space',
      'Hand-drawn sketch style',
      'Export to PNG, SVG, JSON',
      'No sign-up required',
    ],
    badge: 'FREE',
    badgeColor: 'bg-green-500',
  },
  {
    id: 'faceless-video-generator',
    slug: 'faceless-video-generator',
    name: 'Faceless Video Generator',
    description: 'Create TikTok-style videos with Ken Burns effects, audio sync, and animated captions. Perfect for content creators.',
    features: [
      'Ken Burns zoom effects',
      'Word-by-word captions',
      'Combine multiple scenes',
      'Custom caption styling',
    ],
    badge: 'BETA',
    badgeColor: 'bg-cyan-500',
  },
];

const premiumTools: Tool[] = [
  {
    id: 'substack-engine',
    slug: 'substack-engine',
    name: 'Substack Engine',
    description: 'Turn research into polished Substack articles in minutes. Feed it notes and links, get publication-ready content.',
    features: [
      'AI content generation',
      'SEO optimization built-in',
      'Direct Substack publishing',
      'Saves 10+ hours/week',
    ],
    monthlyPrice: 67,
    annualPrice: 670,
    lifetimePrice: 997,
  },
  {
    id: 'reaction-video-generator',
    slug: 'reaction-video',
    name: 'Reaction Video Generator',
    description: 'Upload your reaction footage and source URL. Get professionally composited videos ready to post.',
    features: [
      'Professional compositing',
      'Multiple position styles',
      'Supports .mov and .mp4',
      'Fast email delivery',
    ],
    monthlyPrice: 27,
    annualPrice: 270,
    lifetimePrice: 397,
  },
];

export default function ToolsPage() {
  const router = useRouter();

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-8 text-center">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-4"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Automation Tools for Creators
        </h1>
        <p className="text-lg text-gray-300">
          Save hours every week with AI-powered tools
        </p>
      </section>

      {/* All Access Bundle Banner */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 p-6 sm:p-8">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-xs font-bold mb-3">
                  <span>&#127873;</span> BUNDLE DEAL
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  All Access Pass
                </h2>
                <p className="text-gray-300 mb-1">
                  Get every tool + all future releases
                </p>
                <p className="text-sm text-gray-400">
                  Save 40% vs individual purchases
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">
                  $997
                  <span className="text-lg font-normal text-gray-400">/year</span>
                </div>
                <button
                  onClick={() => router.push('/tools/all-access')}
                  className="mt-3 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Get All Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tools Section */}
      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-green-400">&#9679;</span> Free Tools
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freeTools.map((tool) => (
              <div
                key={tool.id}
                className="p-6 rounded-xl bg-black/50 border border-green-500/30 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                  {tool.badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>

                <ul className="space-y-2 mb-6">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/tools/${tool.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 font-medium hover:bg-green-500/30 transition-colors"
                >
                  {tool.id === 'whiteboard' ? 'Launch Whiteboard' : 'Try Free'}
                  <span>&#8594;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Tools Section */}
      <section className="px-4 sm:px-6 py-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-pink-400">&#9679;</span> Premium Tools
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {premiumTools.map((tool) => (
              <div
                key={tool.id}
                className="p-6 rounded-xl bg-black/50 border border-pink-500/30 hover:border-pink-500/50 transition-colors"
              >
                <h3 className="text-xl font-bold text-white mb-3">{tool.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>

                <ul className="space-y-2 mb-6">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-pink-400">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Pricing Options */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-gray-500 mb-1">Monthly</p>
                    <p className="text-lg font-bold text-white">${tool.monthlyPrice}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-gray-500 mb-1">Annual</p>
                    <p className="text-lg font-bold text-white">${tool.annualPrice}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 text-center">
                    <p className="text-xs text-pink-400 mb-1">Lifetime</p>
                    <p className="text-lg font-bold text-white">${tool.lifetimePrice}</p>
                  </div>
                </div>

                <Link
                  href={`/tools/${tool.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  View Details
                  <span>&#8594;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Need a Complete Business Instead?
          </h2>
          <p className="text-gray-400 mb-6">
            Get a live website, branding, and everything you need to launch in 30 minutes.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            Explore Business in a Box
            <span>&#8594;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

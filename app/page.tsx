"use client";

import { useEffect, useState } from "react";
import ChatInterface from "./components/ChatInterface";
import ShowcaseSection from "@/components/ShowcaseSection";
import Link from "next/link";

export default function Home() {
  const [appsDeployed, setAppsDeployed] = useState<number | null>(null);

  // Ensure page loads at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch live stats
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setAppsDeployed(d.projectsDeployed))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Subtle background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black -z-20" />

      <main id="main-content" className="min-h-screen pt-20 pb-16">
        {/* Hero Section - Chat Front and Center */}
        <section className="px-4 sm:px-6 py-8 sm:py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline — larger, more dominant */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Describe Your Business. Get a Working App.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-300 mb-2">
              Database. Auth. Payments. Email. Custom domain.
            </p>
            <p className="text-base sm:text-lg text-gray-400 mb-2">
              Not a template. Not a mockup. A full-stack app — built and deployed.
            </p>
            <p className="text-base sm:text-lg text-white font-medium mb-8">
              $497 to build. $49/mo to host. Eject anytime.
            </p>

            {/* Chat Interface — visually prominent */}
            <div className="w-full max-w-3xl mx-auto relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-cyan-500/20 to-pink-500/20 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-pink-500/30 bg-black/60 backdrop-blur-md p-4 shadow-2xl shadow-pink-500/5">
                <ChatInterface />
              </div>
            </div>

            {/* Sub-CTA */}
            <p className="mt-6 text-sm text-gray-500">
              Try it free — describe your idea and see what ShipKit builds in 60 seconds
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-4 sm:px-6 py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-400 uppercase tracking-wider mb-12">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center p-8 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">You Talk, We Listen</h3>
                <p className="text-gray-400 text-base leading-relaxed">
                  Record a 60-second voice note or type your business idea. A dog walking app, a SaaS for dentists, a candle brand — anything.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-8 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">AI Builds Your Full-Stack App</h3>
                <p className="text-gray-400 text-base leading-relaxed">
                  Database schema. Auth flows. Payment integration. Email setup. API routes. Frontend UI. All generated and wired together in under 30 minutes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-8 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Your App Goes Live</h3>
                <p className="text-gray-400 text-base leading-relaxed">
                  Deployed to your domain. Stripe connected. Database running. Users can sign up and pay. You&apos;re not planning — you&apos;re live.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section — replaces wireframe mockup */}
        <ShowcaseSection />

        {/* Transparency / Credibility Section */}
        <section className="px-4 sm:px-6 py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-400 uppercase tracking-wider mb-12">
              Built Different
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-b from-pink-500/10 to-transparent border border-pink-500/20 text-center">
                {appsDeployed !== null && appsDeployed > 0 ? (
                  <p className="text-3xl font-black text-white mb-1">{appsDeployed}</p>
                ) : (
                  <p className="text-3xl font-black text-white mb-1">Live</p>
                )}
                <p className="text-sm text-gray-400 mb-4">Apps deployed</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Real Supabase databases, real Vercel deployments, real Stripe Connect accounts. Not demos.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 text-center">
                <p className="text-3xl font-black text-white mb-1">Open</p>
                <p className="text-sm text-gray-400 mb-4">Architecture</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Eject anytime. Your code lives in your GitHub repo. Your database is yours. No lock-in, ever.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 text-center">
                <p className="text-3xl font-black text-white mb-1">~30 min</p>
                <p className="text-sm text-gray-400 mb-4">Idea to production</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  8 AI-generated sections, full provisioning pipeline, deployed and live. Not a wireframe — a running app.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Single Offering Section */}
        <section className="px-4 sm:px-6 py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-400 uppercase tracking-wider mb-4">
              Pricing
            </h2>
            <p className="text-center text-gray-500 mb-10">
              Every vibe-coding tool generates a frontend shell. ShipKit generates the full stack — and deploys it live.
            </p>

            {/* Single Pricing Card */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-b from-pink-500/10 to-cyan-500/10 border-2 border-pink-500/50 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Build My App</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-white">$497</span>
                  <span className="text-gray-400">one-time</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">+ $49/mo hosting (first month free)</p>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Live website, deployed on your domain</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Real database with auth and user management</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Stripe payments — accept money day one</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Transactional email on your domain</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>GitHub repo — your code, transferable</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Eject anytime — take everything with you</span>
                </li>
              </ul>

              <Link
                href="/get-started"
                className="block w-full py-4 text-center rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity"
              >
                Build My App &mdash; $497
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <span className="text-green-400">&#10003;</span>
                30-day money back guarantee
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">&#10003;</span>
                Built in under 30 minutes
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">&#10003;</span>
                Eject anytime — no lock-in
              </span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 sm:px-6 py-20 border-t border-white/5">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-400 mb-2 text-sm">
              One voice note. One full-stack app. One live deployment.
            </p>
            <p className="text-gray-400 mb-2 text-sm">
              Database, auth, payments, email — all wired up and running.
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-4 mb-2">
              Your SaaS, live in 30 minutes.
            </h2>
            <p className="text-gray-500 mb-8 text-sm">
              From idea to production. That&apos;s ShipKit.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Build My App &mdash; $497
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

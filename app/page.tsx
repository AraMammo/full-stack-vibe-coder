"use client";

import { useEffect, useState, useCallback } from "react";
import ChatInterface from "./components/ChatInterface";
import AnalysisCanvas, { type AnalysisData } from "./components/AnalysisCanvas";
import ShowcaseSection from "@/components/ShowcaseSection";
import Link from "next/link";

export default function Home() {
  const [appsDeployed, setAppsDeployed] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(0);

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

  const handleAnalysis = useCallback((data: AnalysisData) => {
    setAnalysis(data);
    setSelectedName(0);
    setCanvasOpen(true);
  }, []);

  return (
    <>
      {/* Subtle background effects */}
      <div className="fixed inset-0 bg-base -z-20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,0,128,0.05)_0%,_rgba(0,170,255,0.03)_40%,_transparent_70%)] -z-10" />

      {/* Canvas overlay for mobile, side panel for desktop */}
      {canvasOpen && analysis && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-base/95 backdrop-blur-sm" onClick={() => setCanvasOpen(false)} />
            <div className="absolute inset-2 top-16 bottom-2 rounded-xl overflow-hidden border border-border shadow-2xl">
              <AnalysisCanvas
                analysis={analysis}
                selectedName={selectedName}
                onSelectName={setSelectedName}
                onClose={() => setCanvasOpen(false)}
              />
            </div>
          </div>

          {/* Desktop: side panel */}
          <div className="hidden lg:block fixed top-16 right-0 bottom-0 w-[520px] z-40 shadow-2xl">
            <AnalysisCanvas
              analysis={analysis}
              selectedName={selectedName}
              onSelectName={setSelectedName}
              onClose={() => setCanvasOpen(false)}
            />
          </div>
        </>
      )}

      <main
        id="main-content"
        className="min-h-screen pt-20 pb-16 transition-all duration-300"
        style={{ marginRight: canvasOpen ? "520px" : "0" }}
      >
        {/* Hero Section - Chat Front and Center */}
        <section className="px-4 sm:px-6 py-8 sm:py-16">
          <div className={`mx-auto text-center transition-all duration-300 ${canvasOpen ? "max-w-2xl" : "max-w-4xl"}`}>
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-[1.1] tracking-tight gradient-text">
              Describe Your Business. Get a Working App.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-fsvc-text-secondary mb-2">
              Database. Auth. Payments. Email. Custom domain.
            </p>
            <p className="text-base sm:text-lg text-fsvc-text-disabled mb-2">
              Not a template. Not a mockup. A full-stack app — built and deployed.
            </p>
            <p className="text-base sm:text-lg text-fsvc-text font-medium mb-8">
              $497 to build. $49/mo to host. Eject anytime.
            </p>

            {/* Chat Interface — visually prominent */}
            <div className="w-full max-w-3xl mx-auto relative">
              <div className="absolute -inset-1 rounded-2xl blur-xl opacity-40" style={{ background: 'linear-gradient(135deg, rgba(255,0,128,0.3), rgba(0,255,136,0.1), rgba(0,170,255,0.3))' }} />
              <div className="relative rounded-xl border border-accent/20 bg-surface/80 backdrop-blur-md p-4 gradient-glow">
                <ChatInterface onAnalysis={handleAnalysis} />
              </div>
            </div>

            {/* Canvas toggle button (when analysis exists but canvas is closed) */}
            {analysis && !canvasOpen && (
              <button
                onClick={() => setCanvasOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Site Preview & Business Brief
              </button>
            )}

            {/* Sub-CTA */}
            {!analysis && (
              <p className="mt-6 text-sm text-fsvc-text-disabled">
                Try it free — describe your idea and see what gets built in 60 seconds
              </p>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-4 sm:px-6 py-20 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-center text-fsvc-text-secondary uppercase tracking-wider mb-12">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center p-8 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full gradient-bg flex items-center justify-center text-xl font-bold text-white">
                  1
                </div>
                <h3 className="text-lg font-semibold text-fsvc-text mb-3">You Talk, We Listen</h3>
                <p className="text-fsvc-text-secondary text-base leading-relaxed">
                  Record a 60-second voice note or type your business idea. A dog walking app, a SaaS for dentists, a candle brand — anything.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-8 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full gradient-bg flex items-center justify-center text-xl font-bold text-white">
                  2
                </div>
                <h3 className="text-lg font-semibold text-fsvc-text mb-3">AI Builds Your Full-Stack App</h3>
                <p className="text-fsvc-text-secondary text-base leading-relaxed">
                  Database schema. Auth flows. Payment integration. Email setup. API routes. Frontend UI. All generated and wired together in under 30 minutes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-8 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full gradient-bg flex items-center justify-center text-xl font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-fsvc-text mb-3">Your App Goes Live</h3>
                <p className="text-fsvc-text-secondary text-base leading-relaxed">
                  Deployed to your domain. Stripe connected. Database running. Users can sign up and pay. You&apos;re not planning — you&apos;re live.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section — replaces wireframe mockup */}
        <ShowcaseSection />

        {/* Transparency / Credibility Section */}
        <section className="px-4 sm:px-6 py-20 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-center text-fsvc-text-secondary uppercase tracking-wider mb-12">
              Built Different
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-surface border border-accent/20 text-center">
                {appsDeployed !== null && appsDeployed > 0 ? (
                  <p className="text-3xl font-black text-fsvc-text mb-1">{appsDeployed}</p>
                ) : (
                  <p className="text-3xl font-black text-fsvc-text mb-1">Live</p>
                )}
                <p className="text-sm text-fsvc-text-disabled mb-4">Apps deployed</p>
                <p className="text-sm text-fsvc-text-secondary leading-relaxed">
                  Real databases, real Vercel deployments, real Stripe Connect accounts. Not demos.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-surface border border-accent-2/20 text-center">
                <p className="text-3xl font-black text-fsvc-text mb-1">Open</p>
                <p className="text-sm text-fsvc-text-disabled mb-4">Architecture</p>
                <p className="text-sm text-fsvc-text-secondary leading-relaxed">
                  Eject anytime. Your code lives in your GitHub repo. Your database is yours. No lock-in, ever.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-surface border border-success/20 text-center">
                <p className="text-3xl font-black text-fsvc-text mb-1">~30 min</p>
                <p className="text-sm text-fsvc-text-disabled mb-4">Idea to production</p>
                <p className="text-sm text-fsvc-text-secondary leading-relaxed">
                  8 AI-generated sections, full provisioning pipeline, deployed and live. Not a wireframe — a running app.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Single Offering Section */}
        <section className="px-4 sm:px-6 py-20 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-center text-fsvc-text-secondary uppercase tracking-wider mb-4">
              Pricing
            </h2>
            <p className="text-center text-fsvc-text-disabled mb-10">
              Every vibe-coding tool generates a frontend shell. We generate the full stack — and deploy it live.
            </p>

            {/* Single Pricing Card */}
            <div className="relative p-8 rounded-2xl bg-surface border-2 border-accent/30 max-w-lg mx-auto gradient-glow">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-fsvc-text mb-2">Build My App</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-fsvc-text">$497</span>
                  <span className="text-fsvc-text-disabled">one-time</span>
                </div>
                <p className="text-sm text-fsvc-text-disabled mt-1">+ $49/mo hosting (first month free)</p>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2 text-fsvc-text-secondary">
                  <span className="text-accent-2 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Live website, deployed on your domain</span>
                </li>
                <li className="flex items-start gap-2 text-fsvc-text-secondary">
                  <span className="text-accent-2 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Real database with auth and user management</span>
                </li>
                <li className="flex items-start gap-2 text-fsvc-text-secondary">
                  <span className="text-accent-2 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Stripe payments — accept money day one</span>
                </li>
                <li className="flex items-start gap-2 text-fsvc-text-secondary">
                  <span className="text-accent-2 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Transactional email on your domain</span>
                </li>
                <li className="flex items-start gap-2 text-fsvc-text-secondary">
                  <span className="text-accent-2 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>GitHub repo — your code, transferable</span>
                </li>
                <li className="flex items-start gap-2 text-fsvc-text-secondary">
                  <span className="text-accent-2 mt-0.5 flex-shrink-0">&#10003;</span>
                  <span>Eject anytime — take everything with you</span>
                </li>
              </ul>

              <Link
                href="/get-started"
                className="block w-full py-4 text-center rounded-lg gradient-bg gradient-bg-hover text-white font-bold text-lg transition-all"
              >
                Build My App &mdash; $497
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-fsvc-text-disabled">
              <span className="flex items-center gap-2">
                <span className="text-success">&#10003;</span>
                30-day money back guarantee
              </span>
              <span className="flex items-center gap-2">
                <span className="text-success">&#10003;</span>
                Built in under 30 minutes
              </span>
              <span className="flex items-center gap-2">
                <span className="text-success">&#10003;</span>
                Eject anytime — no lock-in
              </span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 sm:px-6 py-20 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-fsvc-text-disabled mb-2 text-sm">
              One voice note. One full-stack app. One live deployment.
            </p>
            <p className="text-fsvc-text-disabled mb-2 text-sm">
              Database, auth, payments, email — all wired up and running.
            </p>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-fsvc-text mt-4 mb-2">
              Your SaaS, live in 30 minutes.
            </h2>
            <p className="text-fsvc-text-disabled mb-8 text-sm">
              From idea to production. That&apos;s Full Stack Vibe Coder.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg gradient-bg gradient-bg-hover text-white font-bold text-lg transition-all"
            >
              Build My App &mdash; $497
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

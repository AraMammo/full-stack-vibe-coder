"use client";

import { useEffect, useRef } from "react";
import ChatInterface from "./components/ChatInterface";
import Link from "next/link";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ensure page loads at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Simplified particle animation (reduced density)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
        this.opacity = Math.random() * 0.3 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(236, 72, 153, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push(new Particle());
    }

    function connectParticles() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(236, 72, 153, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* Subtle background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black -z-20" />
      <canvas ref={canvasRef} className="fixed inset-0 -z-10 opacity-50" />

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

        {/* What You Get — Visual Preview Section (P0) */}
        <section className="px-4 sm:px-6 py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-400 uppercase tracking-wider mb-4">
              What You Get
            </h2>
            <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
              A real, deployed application — not a mockup. Here&apos;s what ships with every ShipKit build.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* App Screenshot Placeholder — Dashboard */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-1 overflow-hidden">
                <div className="rounded-lg bg-gradient-to-br from-gray-900 to-black p-6 h-64 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      <span className="text-xs text-gray-600 ml-2">yourapp.com/dashboard</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 w-32 bg-white/10 rounded" />
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-16 bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 rounded-lg" />
                        <div className="h-16 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 rounded-lg" />
                        <div className="h-16 bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-lg" />
                      </div>
                      <div className="h-20 bg-white/5 border border-white/10 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 text-center">Admin dashboard with analytics</p>
                </div>
              </div>

              {/* Stack Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-8 rounded-full bg-pink-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Frontend</p>
                    <p className="text-xs text-gray-400">Next.js 14 + Tailwind CSS</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-8 rounded-full bg-cyan-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Database</p>
                    <p className="text-xs text-gray-400">Supabase PostgreSQL + Row-Level Security</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-8 rounded-full bg-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Auth</p>
                    <p className="text-xs text-gray-400">NextAuth.js — Google, email, magic links</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-8 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Payments</p>
                    <p className="text-xs text-gray-400">Stripe Connect — your account, your revenue</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-8 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Email</p>
                    <p className="text-xs text-gray-400">Transactional email on your domain</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-8 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Hosting</p>
                    <p className="text-xs text-gray-400">Vercel — auto-deploys from GitHub</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section (P0) */}
        <section className="px-4 sm:px-6 py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-400 uppercase tracking-wider mb-12">
              Real Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-b from-pink-500/10 to-transparent border border-pink-500/20">
                <p className="text-3xl font-black text-white mb-1">$847</p>
                <p className="text-sm text-gray-400 mb-4">First month revenue</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  &ldquo;I built an AI dev agency with ShipKit. Month one: $847 in revenue, three paying clients, zero lines of code written by hand.&rdquo;
                </p>
                <p className="text-xs text-pink-400 mt-4 font-medium">Ara M. — Founder, ShipKit</p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20">
                <p className="text-3xl font-black text-white mb-1">$3K MRR</p>
                <p className="text-sm text-gray-400 mb-4">In one week</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  &ldquo;Client went from idea to $3K MRR in one week. SaaS MVP built in 3 days, launched, paying customers by day 7.&rdquo;
                </p>
                <p className="text-xs text-cyan-400 mt-4 font-medium">Case Study — SaaS MVP</p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20">
                <p className="text-3xl font-black text-white mb-1">48 Hours</p>
                <p className="text-sm text-gray-400 mb-4">Entire platform built</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  &ldquo;I built this entire platform in 48 hours. What worked, what broke, and how AI did 90% of the heavy lifting.&rdquo;
                </p>
                <p className="text-xs text-green-400 mt-4 font-medium">Building in Public</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4">
                Read more case studies on the blog
              </Link>
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

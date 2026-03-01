"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "./components/ChatInterface";
import Link from "next/link";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

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

    // Reduced particle count for cleaner look
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
    // Reduced from 100 to 40 particles
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
        <section className="px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              One Voice Note. One Complete Business.
            </h1>

            {/* Subheadline - Sunnybrook-style specificity */}
            <p className="text-lg sm:text-xl text-gray-300 mb-2">
              One idea. Three business names. Five logo designs. A full brand identity.
            </p>
            <p className="text-base sm:text-lg text-gray-400 mb-2">
              Market research. Financial projections. A launch strategy.
            </p>
            <p className="text-base sm:text-lg text-white font-medium mb-6">
              And a live website — deployed and ready for customers.
            </p>

            {/* Chat Interface - The Star of the Show */}
            <div className="w-full max-w-3xl mx-auto">
              <ChatInterface />
            </div>

            {/* Sub-CTA */}
            <p className="mt-4 text-sm text-gray-500">
              Try it free — describe your idea and get your first business brief in 60 seconds
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-12">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">You Talk, We Listen</h3>
                <p className="text-gray-400 text-sm">
                  Record a 60-second voice note or type your business idea. A dog walking app, a SaaS for dentists, a candle brand — anything.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Eight AI Agents Get to Work</h3>
                <p className="text-gray-400 text-sm">
                  Brand identity. Market research. Financial model. Marketing strategy. Five logo concepts. A full Next.js codebase. Built simultaneously in under 30 minutes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">You Open for Business</h3>
                <p className="text-gray-400 text-sm">
                  A live website on your domain. A GitHub repo you own. Brand assets ready for social. You&apos;re not planning a business — you&apos;re running one.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-4">
              Three Ways to Ship
            </h2>
            <p className="text-center text-gray-400 mb-12">
              Start free. Upgrade when you&apos;re ready to go all in.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ShipKit Lite - Free */}
              <div className="relative p-6 rounded-xl bg-black/50 border border-white/10 hover:border-green-500/30 transition-all">
                <h3 className="text-lg font-semibold text-white mb-1">ShipKit Lite</h3>
                <div className="text-3xl font-bold text-green-400 mb-4">
                  Free
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>3 business name options with taglines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Target audience breakdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Competitive positioning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Site preview mockup</span>
                  </li>
                </ul>
                <Link
                  href="/get-started?tier=VALIDATION_PACK"
                  className="block w-full py-3 text-center rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/10 transition-colors font-semibold"
                >
                  Try It Free
                </Link>
              </div>

              {/* ShipKit Pro - Highlighted */}
              <div className="relative p-6 rounded-xl bg-gradient-to-b from-pink-500/10 to-cyan-500/10 border-2 border-pink-500/50 hover:border-pink-500 transition-all transform md:-translate-y-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full text-xs font-bold text-white">
                  POPULAR
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">ShipKit Pro</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  $197
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Everything in Lite</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>5 logo concepts + brand guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Marketing &amp; launch strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Financial projections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Complete business plan</span>
                  </li>
                </ul>
                <Link
                  href="/get-started?tier=LAUNCH_BLUEPRINT"
                  className="block w-full py-3 text-center rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>

              {/* ShipKit Complete */}
              <div className="relative p-6 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 rounded-full text-xs font-bold text-white">
                  BEST VALUE
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">ShipKit Complete</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  $497
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Full Next.js codebase on GitHub</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Live website, deployed and running</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>30 days of support</span>
                  </li>
                </ul>
                <Link
                  href="/get-started?tier=TURNKEY_SYSTEM"
                  className="block w-full py-3 text-center rounded-lg border border-cyan-500/50 text-white hover:bg-cyan-500/10 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <span className="text-green-400">&#10003;</span>
                30-day money back guarantee
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">&#10003;</span>
                Delivered in under 30 minutes
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">&#10003;</span>
                Own everything forever
              </span>
            </div>
          </div>
        </section>

        {/* Final CTA - Sunnybrook-style momentum */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-400 mb-2 text-sm">
              One voice note. Eight AI agents. Three business names. Five logo concepts.
            </p>
            <p className="text-gray-400 mb-2 text-sm">
              One brand identity. One market analysis. One financial model. One launch strategy.
            </p>
            <p className="text-gray-400 mb-2 text-sm">
              One complete codebase. One deployed website. One GitHub repo.
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-4 mb-2">
              And one founder, open for business.
            </h2>
            <p className="text-gray-500 mb-8 text-sm">
              From idea to income. That&apos;s ShipKit.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <span>&#8593;</span>
              Start With Your Idea
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

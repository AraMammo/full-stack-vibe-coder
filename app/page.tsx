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
              Describe Your Business. Get a Working App.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-300 mb-2">
              Database. Auth. Payments. Email. Custom domain.
            </p>
            <p className="text-base sm:text-lg text-gray-400 mb-2">
              Not a template. Not a mockup. A full-stack app — built and deployed.
            </p>
            <p className="text-base sm:text-lg text-white font-medium mb-6">
              $497 to build. $49/mo to host. Eject anytime.
            </p>

            {/* Chat Interface - The Star of the Show */}
            <div className="w-full max-w-3xl mx-auto">
              <ChatInterface />
            </div>

            {/* Sub-CTA */}
            <p className="mt-4 text-sm text-gray-500">
              Try it free — describe your idea and see what ShipKit builds in 60 seconds
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
                <h3 className="text-lg font-semibold text-white mb-2">AI Builds Your Full-Stack App</h3>
                <p className="text-gray-400 text-sm">
                  Database schema. Auth flows. Payment integration. Email setup. API routes. Frontend UI. All generated and wired together in under 30 minutes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Your App Goes Live</h3>
                <p className="text-gray-400 text-sm">
                  Deployed to your domain. Stripe connected. Database running. Users can sign up and pay. You&apos;re not planning — you&apos;re live.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Single Offering Section */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-4">
              One Price. One Working App.
            </h2>
            <p className="text-center text-gray-400 mb-10">
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
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
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
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Build My App &mdash; $497
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

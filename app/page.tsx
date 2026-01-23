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
              Turn Your Business Idea Into Reality
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-300 mb-2">
              Live website. Brand identity. Market research. Launch guide.
            </p>
            <p className="text-base sm:text-lg text-gray-400 mb-6">
              All from one voice note. Delivered in 30 minutes.
            </p>

            {/* Chat Interface - The Star of the Show */}
            <div className="w-full max-w-3xl mx-auto">
              <ChatInterface />
            </div>

            {/* Sub-CTA */}
            <p className="mt-4 text-sm text-gray-500">
              Describe your idea above to see what we can create for you
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
                <h3 className="text-lg font-semibold text-white mb-2">Share Your Idea</h3>
                <p className="text-gray-400 text-sm">
                  Type or record a voice note describing your business concept. The more detail, the better the output.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Builds Everything</h3>
                <p className="text-gray-400 text-sm">
                  Our system generates your website, branding, market research, and business materials automatically.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Launch Ready</h3>
                <p className="text-gray-400 text-sm">
                  Download everything and go live immediately. Your complete business package in under 30 minutes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-4">
              Choose Your Package
            </h2>
            <p className="text-center text-gray-400 mb-12">
              Everything you need to launch your business
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter */}
              <div className="relative p-6 rounded-xl bg-black/50 border border-white/10 hover:border-pink-500/30 transition-all">
                <h3 className="text-lg font-semibold text-white mb-1">Starter</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  $47
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Market Research Report</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Competitive Analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Business Name Ideas</span>
                  </li>
                </ul>
                <Link
                  href="/get-started"
                  className="block w-full py-3 text-center rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
                >
                  Get Started
                </Link>
              </div>

              {/* Complete - Highlighted */}
              <div className="relative p-6 rounded-xl bg-gradient-to-b from-pink-500/10 to-cyan-500/10 border-2 border-pink-500/50 hover:border-pink-500 transition-all transform md:-translate-y-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full text-xs font-bold text-white">
                  POPULAR
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Complete</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  $197
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>5 Logo Variations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Brand Guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Pitch Deck</span>
                  </li>
                </ul>
                <Link
                  href="/get-started"
                  className="block w-full py-3 text-center rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>

              {/* Turnkey */}
              <div className="relative p-6 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 rounded-full text-xs font-bold text-white">
                  BEST VALUE
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Turnkey</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  $497
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Everything in Complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Live Deployed Website</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>Custom Domain Setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&#10003;</span>
                    <span>30-Day Support</span>
                  </li>
                </ul>
                <Link
                  href="/get-started"
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

        {/* Tools Section Preview */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Automation Tools for Creators
            </h2>
            <p className="text-gray-400 mb-8">
              Save hours every week with AI-powered tools
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">&#128221;</span>
                  <span className="font-semibold text-white">Whiteboard</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">FREE</span>
                </div>
                <p className="text-sm text-gray-400">Collaborative whiteboard for brainstorming and planning</p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">&#127909;</span>
                  <span className="font-semibold text-white">Faceless Video</span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">BETA</span>
                </div>
                <p className="text-sm text-gray-400">Generate faceless videos for social media content</p>
              </div>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-pink-500/50 text-pink-400 hover:bg-pink-500/10 transition-colors"
            >
              Explore All Tools
              <span>&#8594;</span>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Launch?
            </h2>
            <p className="text-gray-400 mb-8">
              Start with your idea above and see what we can create for you
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

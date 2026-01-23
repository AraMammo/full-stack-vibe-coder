/**
 * Pricing Page - Simplified
 *
 * Clean, focused pricing page with 3 clear options.
 * Part of UX overhaul for frictionless conversion.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Tier {
  id: "VALIDATION_PACK" | "LAUNCH_BLUEPRINT" | "TURNKEY_SYSTEM";
  name: string;
  price: number;
  description: string;
  features: string[];
  highlight?: "popular" | "best";
  cta: string;
}

const tiers: Tier[] = [
  {
    id: "VALIDATION_PACK",
    name: "Starter",
    price: 47,
    description: "Test your idea with market research",
    features: [
      "Market Research Report",
      "Competitive Analysis",
      "Target Audience Definition",
      "Business Model Validation",
      "Pricing Recommendations",
    ],
    cta: "Get Started",
  },
  {
    id: "LAUNCH_BLUEPRINT",
    name: "Complete",
    price: 197,
    description: "Full business plan with branding",
    features: [
      "Everything in Starter",
      "5 Custom Logo Designs",
      "Brand Guidelines",
      "Investor Pitch Deck",
      "Marketing Strategy",
      "Financial Projections",
    ],
    highlight: "popular",
    cta: "Get Started",
  },
  {
    id: "TURNKEY_SYSTEM",
    name: "Turnkey",
    price: 497,
    description: "Complete business ready to launch",
    features: [
      "Everything in Complete",
      "Live Deployed Website",
      "Custom Domain Setup Guide",
      "Payment System Ready",
      "Email System Configured",
      "30-Day Support",
    ],
    highlight: "best",
    cta: "Get Started",
  },
];

const faqs = [
  {
    question: "How does 30-minute delivery work?",
    answer:
      "After payment, you record a voice note describing your business. Our AI immediately builds your complete package. You'll see progress updates and receive everything within 30 minutes.",
  },
  {
    question: "Can I customize the website?",
    answer:
      "Yes! You get full access to the code on GitHub. The Turnkey package includes a step-by-step guide for making changes and connecting your own domain.",
  },
  {
    question: "What's your refund policy?",
    answer:
      "We offer a 30-day money back guarantee. If you're not satisfied with your deliverables, contact us for a full refund.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger checkout if user returns from sign-in with tier parameter
  useEffect(() => {
    const tier = searchParams.get("tier");
    if (tier && session && status === "authenticated" && !loading) {
      handleSelectTier(tier);
      router.replace("/get-started");
    }
  }, [session, status, searchParams]);

  const handleSelectTier = async (tierId: string) => {
    if (status === "loading") return;

    if (!session) {
      const callbackUrl = encodeURIComponent(`/get-started?tier=${tierId}`);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    setLoading(tierId);
    setError(null);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierId,
          userEmail: session.user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-8 text-center">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-4"
          style={{
            background:
              "linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Choose Your Package
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          Voice note to complete business in 30 minutes
        </p>
        <p className="text-gray-400">
          Everything you need to launch, no templates
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`
                  relative p-6 rounded-2xl transition-all
                  ${
                    tier.highlight === "popular"
                      ? "bg-gradient-to-b from-pink-500/10 to-cyan-500/10 border-2 border-pink-500/50 md:-translate-y-4"
                      : tier.highlight === "best"
                      ? "bg-gradient-to-b from-cyan-500/10 to-green-500/10 border-2 border-cyan-500/50"
                      : "bg-black/50 border border-white/10"
                  }
                `}
              >
                {/* Badge */}
                {tier.highlight && (
                  <div
                    className={`
                      absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white
                      ${
                        tier.highlight === "popular"
                          ? "bg-gradient-to-r from-pink-500 to-purple-500"
                          : "bg-gradient-to-r from-cyan-500 to-green-500"
                      }
                    `}
                  >
                    {tier.highlight === "popular" ? "MOST POPULAR" : "BEST VALUE"}
                  </div>
                )}

                {/* Header */}
                <h2 className="text-xl font-bold text-white mb-1">{tier.name}</h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-white">${tier.price}</span>
                  <span className="text-gray-400 text-sm">one-time</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-cyan-400 mt-0.5 flex-shrink-0">
                        &#10003;
                      </span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectTier(tier.id)}
                  disabled={loading !== null}
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold transition-all
                    ${
                      tier.highlight
                        ? "bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    }
                    ${loading === tier.id ? "opacity-70 cursor-wait" : ""}
                    ${loading !== null && loading !== tier.id ? "opacity-50" : ""}
                  `}
                >
                  {loading === tier.id ? "Processing..." : tier.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
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

      {/* How It Works - Condensed */}
      <section className="px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">
            How It Works
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-white">Record Voice Note</p>
                <p className="text-xs text-gray-400">Describe your idea</p>
              </div>
            </div>

            <div className="hidden md:block text-gray-600">&#8594;</div>

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-white">AI Builds Everything</p>
                <p className="text-xs text-gray-400">Under 30 minutes</p>
              </div>
            </div>

            <div className="hidden md:block text-gray-600">&#8594;</div>

            {/* Step 3 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400 font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-white">Launch & Sell</p>
                <p className="text-xs text-gray-400">Go live immediately</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included - Turnkey Highlight */}
      <section className="px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            What You Get with Turnkey
          </h2>
          <p className="text-center text-gray-400 mb-10">
            The complete package for serious entrepreneurs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "&#127760;", title: "Live Website", desc: "Deployed and working" },
              { icon: "&#127912;", title: "5 Logo Designs", desc: "Professional variations" },
              { icon: "&#128200;", title: "Market Research", desc: "Competitive analysis" },
              { icon: "&#128196;", title: "Business Plan", desc: "Complete strategy" },
              { icon: "&#127919;", title: "Marketing Plan", desc: "Go-to-market guide" },
              { icon: "&#128640;", title: "Launch Guide", desc: "Step-by-step setup" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Condensed */}
      <section className="px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">
            Questions?
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-white/10 pb-6">
                <h3 className="font-medium text-white mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
            >
              View all FAQs &#8594;
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Launch?
          </h2>
          <p className="text-gray-400 mb-8">
            30 minutes from now, you could have a complete business ready to sell.
          </p>
          <button
            onClick={() => handleSelectTier("TURNKEY_SYSTEM")}
            disabled={loading !== null}
            className={`
              inline-flex items-center gap-2 px-8 py-4 rounded-lg
              bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold
              hover:opacity-90 transition-opacity
              ${loading === "TURNKEY_SYSTEM" ? "opacity-70 cursor-wait" : ""}
            `}
          >
            {loading === "TURNKEY_SYSTEM"
              ? "Processing..."
              : "Get Your Market-Ready Business - $497"}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            One-time payment. No subscriptions. Own everything.
          </p>
        </div>
      </section>
    </main>
  );
}

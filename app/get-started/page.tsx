/**
 * Get Started Page - Single Offering
 *
 * Clean, focused page with one clear call to action: Build My App — $497
 * Free preview tier still available as a secondary option.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const features = [
  { title: "Live Website", desc: "Deployed on your custom domain, SSL included" },
  { title: "Real Database", desc: "PostgreSQL with migrations, backups, and row-level security" },
  { title: "User Auth", desc: "Sign up, login, password reset — all wired up" },
  { title: "Stripe Payments", desc: "Accept payments from day one with your own Stripe account" },
  { title: "Transactional Email", desc: "Welcome emails, receipts, notifications on your domain" },
  { title: "GitHub Repo", desc: "Full Next.js codebase — your code, transferable anytime" },
  { title: "Admin Dashboard", desc: "Manage users, view analytics, monitor your app" },
  { title: "30 Days Free Hosting", desc: "First month included, then $49/mo — cancel or eject anytime" },
];

const faqs = [
  {
    question: "What kind of apps can ShipKit build?",
    answer:
      "Any business that needs a web app. SaaS tools, booking platforms, marketplaces, membership sites, directories, dashboards — if it runs on the web, ShipKit can build it. You describe it, we generate the full stack.",
  },
  {
    question: "How is this different from v0, Bolt, or Lovable?",
    answer:
      "Those tools generate frontend components. ShipKit generates the entire application — database schema, API routes, auth, payments, email — and deploys it live. You get a working app, not a UI prototype.",
  },
  {
    question: "What does 'eject' mean?",
    answer:
      "You own everything. At any time, you can download your code, export your database, and run it on your own infrastructure. We give you a migration guide, cancel your hosting, and you're free. No lock-in.",
  },
  {
    question: "What if the generated app needs changes?",
    answer:
      "You have full access to the GitHub repo. Edit the code yourself, hire a developer, or use AI tools like Cursor or Claude. It's a standard Next.js app — no proprietary framework.",
  },
];

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostingAgreed, setHostingAgreed] = useState(false);

  // Auto-trigger checkout only for free preview (no hosting terms needed)
  useEffect(() => {
    const tier = searchParams.get("tier");
    if (tier === "VALIDATION_PACK" && status !== "loading" && !loading) {
      handleBuildApp("VALIDATION_PACK");
    }
  }, [status, searchParams]);

  const handleBuildApp = async (tier: string = "TURNKEY_SYSTEM") => {
    if (status === "loading") return;

    if (!session) {
      const callbackUrl = encodeURIComponent(`/get-started?tier=${tier}`);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chatSessionId = searchParams.get("sessionId");
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          userEmail: session.user?.email,
          ...(chatSessionId ? { sessionId: chatSessionId } : {}),
          ...(tier === "TURNKEY_SYSTEM" ? { hostingAgreed } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.free) {
        sessionStorage.setItem("selectedTier", data.tier);
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16">
      {/* Hero — shorter, straight to checkout */}
      <section className="px-4 sm:px-6 py-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Build My App
        </h1>
        <p className="text-gray-400">
          One payment. One working app. Deployed and live.
        </p>
      </section>

      {/* Single Pricing Card */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-lg mx-auto">
          <div className="relative p-8 rounded-2xl bg-gradient-to-b from-pink-500/10 to-cyan-500/10 border-2 border-pink-500/50">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-3">Build My App</h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-white">$497</span>
                <span className="text-gray-400">one-time</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                + $49/mo hosting after 30-day free trial
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">&#10003;</span>
                  <div>
                    <span className="text-white font-medium">{feature.title}</span>
                    <span className="text-gray-400"> &mdash; {feature.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Hosting Terms */}
            <label className="flex items-start gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={hostingAgreed}
                onChange={(e) => setHostingAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-white/10 text-cyan-500 focus:ring-cyan-500/50"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                I understand that hosting is $49/mo after a 30-day free trial.
                Cancel or eject anytime.
              </span>
            </label>

            {/* CTA */}
            <button
              onClick={() => handleBuildApp("TURNKEY_SYSTEM")}
              disabled={loading || !hostingAgreed}
              className={`
                w-full py-4 px-4 rounded-lg font-bold text-lg transition-all
                bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90
                ${loading || !hostingAgreed ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {loading ? "Processing..." : "Build My App \u2014 $497"}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              30-day money back guarantee. Eject anytime.
            </p>
          </div>

          {/* Free Preview Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => handleBuildApp("VALIDATION_PACK")}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
            >
              Or try a free preview first
            </button>
          </div>

          {/* Enterprise */}
          <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/5 text-center">
            <h3 className="text-white font-semibold mb-1">Need more?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Custom builds, dedicated infrastructure, SLA guarantees.
            </p>
            <a
              href="mailto:ara@shipkit.io?subject=ShipKit Enterprise"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Talk to us
            </a>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
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
        </div>
      </section>

    </main>
  );
}

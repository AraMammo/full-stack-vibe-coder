/**
 * Checkout Page
 *
 * Displays project summary and initiates Stripe checkout for the build.
 * After payment, Stripe webhook triggers the full build pipeline.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  industryProfile: {
    businessName: string;
    tagline?: string;
    services: Array<{ name: string }>;
  } | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [hostingAgreed, setHostingAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      router.push("/get-started");
      return;
    }
    if (authStatus === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/checkout?projectId=${projectId}`);
      return;
    }
    if (authStatus === "authenticated") {
      fetchProject();
    }
  }, [projectId, authStatus]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/status`);
      if (!res.ok) throw new Error("Project not found");
      const data = await res.json();
      setProject(data.project);
    } catch {
      setError("Could not load project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!projectId || !hostingAgreed) return;

    setCheckingOut(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckingOut(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-2 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-fsvc-text-secondary mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => router.push("/get-started")}
            className="text-accent-2 hover:underline"
          >
            Start over
          </button>
        </div>
      </main>
    );
  }

  const profile = project.industryProfile;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Ready to build
        </h1>
        <p className="text-fsvc-text-secondary text-center mb-8">
          Review your project and proceed to payment
        </p>

        {/* Project Summary */}
        <div className="rounded-xl border border-border bg-white/5 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            {profile?.businessName || project.name}
          </h2>
          {profile?.tagline && (
            <p className="text-sm text-fsvc-text-secondary mb-3">{profile.tagline}</p>
          )}
          {profile?.services && profile.services.length > 0 && (
            <div>
              <p className="text-xs text-fsvc-text-disabled uppercase tracking-wide mb-2">
                Services
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((svc, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-white/10 text-xs text-gray-300"
                  >
                    {svc.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* What You Get */}
        <div className="rounded-xl border border-border bg-white/5 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            What&apos;s included
          </h3>
          <ul className="space-y-2 text-sm">
            {[
              "Live website with custom branding",
              "PostgreSQL database with your data",
              "Booking system & client portal",
              "Stripe payment processing",
              "GitHub repo (your code, transferable)",
              "30 days free hosting, then $49/mo",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-300">
                <span className="text-accent-2">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Price + Checkout */}
        <div className="rounded-xl border-2 border-accent/50 bg-accent/5 p-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-black text-white">$497</span>
            <span className="text-fsvc-text-secondary ml-2">one-time</span>
          </div>

          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={hostingAgreed}
              onChange={(e) => setHostingAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-white/10"
            />
            <span className="text-xs text-fsvc-text-secondary leading-relaxed">
              I understand hosting is $49/mo after 30 days free. Cancel or eject
              anytime — you keep everything.
            </span>
          </label>

          <button
            onClick={handleCheckout}
            disabled={checkingOut || !hostingAgreed}
            className="w-full py-4 rounded-lg bg-accent hover:bg-accent-hover text-base font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checkingOut ? "Redirecting to Stripe..." : "Pay $497 & Build"}
          </button>

          <p className="text-center text-xs text-fsvc-text-disabled mt-3">
            30-day money back guarantee
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

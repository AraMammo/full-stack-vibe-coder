/**
 * Market-Ready Business - Get Started Page
 *
 * Transform your voice note into a complete market-ready business in 30 minutes
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tier {
  id: "VALIDATION_PACK" | "LAUNCH_BLUEPRINT" | "TURNKEY_SYSTEM";
  name: string;
  price: number;
  badge?: string;
  badgeColor?: string;
  description: string;
  timeline: string;
  delivery: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const tiers: Tier[] = [
  {
    id: "VALIDATION_PACK",
    name: "Validation Pack",
    price: 47,
    description: "Test your idea before investing heavily",
    timeline: "5 minutes",
    delivery: "Comprehensive PDF Report",
    features: [
      "Business Model Analysis",
      "Competitive Research",
      "Target Audience Definition",
      "Pricing Strategy Recommendations",
      "Go-to-Market Plan",
    ],
    cta: "Start Validation",
  },
  {
    id: "LAUNCH_BLUEPRINT",
    name: "Launch Blueprint",
    price: 197,
    badge: "MOST POPULAR",
    badgeColor: "bg-purple-500",
    description: "Complete business plan with professional brand",
    timeline: "15 minutes",
    delivery: "Organized ZIP Package with Brand Assets",
    features: [
      "Everything in Validation Pack",
      "+ 11 Additional Business Planning Sections",
      "+ 5 Custom AI-Generated Logo Designs",
      "+ Professional Investor Pitch Deck",
      "Comprehensive Market & Competitor Analysis",
      "Financial Projections & Budget Planning",
    ],
    cta: "Get Your Business Blueprint",
    popular: true,
  },
  {
    id: "TURNKEY_SYSTEM",
    name: "Market-Ready Business",
    price: 497,
    badge: "COMPLETE SOLUTION",
    badgeColor: "bg-gradient-to-r from-yellow-400 to-orange-500",
    description: "Live website + everything you need to launch today",
    timeline: "30 minutes",
    delivery: "Working Website + Complete Launch Guide",
    features: [
      "🌐 Live Website (deployed & working)",
      "🎨 5 Custom Logo Variations",
      "📊 Competitive Analysis Report",
      "📈 Complete Business Plan",
      "🎯 Marketing Strategy",
      "💳 Payment System Ready",
      "📧 Email System Configured",
      "🚀 Step-by-Step Launch Guide",
    ],
    cta: "Get Market-Ready Now",
  },
];

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What makes this different from other business services?",
    answer:
      "You record a voice note about your idea, and our AI builds everything custom for you in 30 minutes. No templates, no consultants, no waiting weeks. You get a live, working website plus all the business materials you need to start selling immediately.",
  },
  {
    question: "How does the 30-minute delivery work?",
    answer:
      "After payment, you record a voice note describing your business idea. Our AI agents immediately start building your complete business package. You'll see real-time progress updates and receive everything within 30 minutes - guaranteed.",
  },
  {
    question: "What if I already have a business?",
    answer:
      "Perfect! The Market-Ready Business package will give you a professional website, brand identity, and all the digital assets you need to compete online. Many existing businesses use this to finally get their online presence sorted.",
  },
  {
    question: "Can I customize the website after delivery?",
    answer:
      "Yes! You get full access to the code repository on GitHub. The launch guide includes instructions for making changes. If you need help with customization, we offer additional support packages.",
  },
  {
    question: "What's your refund policy?",
    answer:
      "Due to the instant, AI-generated nature of deliverables, all sales are final. However, if there's a technical issue preventing delivery, we'll work with you to resolve it or issue a full refund.",
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors px-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900 rounded"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-gray-900">
          {faq.question}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-700">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTier = async (tierId: string) => {
    console.log("[Pricing] 🎯 User clicked tier:", tierId);
    setLoading(tierId);
    setError(null);

    try {
      // Call create-checkout API
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      console.log("[Pricing] ✓ Checkout session created:", data.sessionId);
      console.log("[Pricing] 🚀 Redirecting to Stripe checkout...");

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("[Pricing] ✗ Checkout error:", err.message);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <section className="pricing-page-header">
        <h1 className="pricing-page-title">Voice Note → Market-Ready Business</h1>
        <p className="pricing-page-subtitle" style={{ fontSize: "1.3rem", fontWeight: "600" }}>
          30 minutes. $497. Everything you need to launch.
        </p>
        <p className="pricing-page-subtitle" style={{ marginTop: "1rem" }}>
          Record a voice note about your idea. Get a live website, logos, business plan,<br/>
          competitive analysis, and complete launch guide. No templates. 100% custom.
        </p>
      </section>

      {/* What You Get Section - Visual showcase */}
      <section className="deliverables-showcase">
        <h2 className="deliverables-title">What You Actually Get</h2>
        <p className="deliverables-subtitle">
          Real deliverables. Working website. Ready to sell immediately.
        </p>

        <div className="deliverables-grid">
          <div className="deliverable-item">
            <div className="deliverable-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>Business Analysis</h3>
            <p>Complete market research, competitor analysis, and business model validation</p>
          </div>

          <div className="deliverable-item">
            <div className="deliverable-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3>5 Custom Logos</h3>
            <p>AI-generated logo designs tailored to your brand strategy and target market</p>
          </div>

          <div className="deliverable-item">
            <div className="deliverable-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3>Brand Strategy</h3>
            <p>Complete visual identity, messaging framework, and positioning strategy</p>
          </div>

          <div className="deliverable-item">
            <div className="deliverable-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3>Live Working Website</h3>
            <p>A live website deployed to a development link you can click through and test immediately</p>
          </div>

          <div className="deliverable-item">
            <div className="deliverable-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3>Publishing Guide</h3>
            <p>Step-by-step guide to connect your own domain and publish your site—everything from our delivery to your live site</p>
          </div>

          <div className="deliverable-item">
            <div className="deliverable-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>30-Minute Delivery</h3>
            <p>Complete business package delivered in under 30 minutes, not 30 days</p>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="delivery-timeline">
          <h3 className="timeline-title">How It Works</h3>
          <div className="timeline-steps">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Record Voice Note</h4>
                <p>2 minutes</p>
              </div>
            </div>
            <div className="timeline-arrow">→</div>
            <div className="timeline-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>AI Generates Everything</h4>
                <p>Under 30 minutes</p>
              </div>
            </div>
            <div className="timeline-arrow">→</div>
            <div className="timeline-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Review & Publish</h4>
                <p>Follow the guide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <div className="pricing-cards-grid">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`pricing-tier-card ${tier.popular ? "popular-tier" : ""}`}
          >
            {/* Badge */}
            {tier.badge && tier.popular && (
              <span className="popular-badge">{tier.badge}</span>
            )}

            {/* Header */}
            <h2 className="tier-name">{tier.name}</h2>
            <div className="tier-price">
              ${tier.price}
              <span className="price-unit"> / one-time</span>
            </div>
            <p className="tier-description">{tier.description}</p>

            {/* Timeline & Delivery */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                <svg
                  style={{
                    width: "20px",
                    height: "20px",
                    marginRight: "8px",
                    fill: "none",
                    stroke: "currentColor",
                  }}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Timeline: {tier.timeline}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                <svg
                  style={{
                    width: "20px",
                    height: "20px",
                    marginRight: "8px",
                    fill: "none",
                    stroke: "currentColor",
                  }}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Delivery: {tier.delivery}</span>
              </div>
            </div>

            {/* Features */}
            <ul className="tier-features">
              {tier.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectTier(tier.id)}
              className="pricing-cta-button"
              disabled={loading !== null}
              style={{
                opacity: loading !== null && loading !== tier.id ? 0.5 : 1,
                cursor: loading !== null ? "wait" : "pointer",
              }}
            >
              {loading === tier.id ? "Loading..." : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            maxWidth: "600px",
            margin: "2rem auto",
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#ef4444",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {/* Launch Guide Preview */}
      <section style={{ padding: "4rem 2rem", background: "rgba(0, 255, 0, 0.02)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "2.5rem",
            textAlign: "center",
            marginBottom: "1rem",
            backgroundImage: "linear-gradient(135deg, #00ff00, #00ffff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            🚀 Your Website Launch Guide (Included with Market-Ready)
          </h2>
          <p style={{
            textAlign: "center",
            color: "#a0a0a0",
            marginBottom: "3rem",
            fontSize: "1.2rem",
          }}>
            We don't just build it. We show you exactly how to launch it.
          </p>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
            marginBottom: "3rem",
          }}>
            {/* Step 1 */}
            <div style={{
              background: "rgba(0, 255, 0, 0.05)",
              border: "1px solid rgba(0, 255, 0, 0.2)",
              borderRadius: "15px",
              padding: "30px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                top: "-15px",
                left: "30px",
                background: "#00ff00",
                color: "#000",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}>1</div>
              <h3 style={{ marginTop: "10px", marginBottom: "10px", color: "#00ff00" }}>
                Choose Your Domain
              </h3>
              <p style={{ color: "#e0e0e0", marginBottom: "1rem" }}>
                Step-by-step guide to selecting and purchasing the perfect domain name for your business.
              </p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Domain registrar recommendations</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Name selection best practices</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Cost breakdown ($10-15/year)</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div style={{
              background: "rgba(0, 255, 0, 0.05)",
              border: "1px solid rgba(0, 255, 0, 0.2)",
              borderRadius: "15px",
              padding: "30px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                top: "-15px",
                left: "30px",
                background: "#00ff00",
                color: "#000",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}>2</div>
              <h3 style={{ marginTop: "10px", marginBottom: "10px", color: "#00ff00" }}>
                Connect to Vercel
              </h3>
              <p style={{ color: "#e0e0e0", marginBottom: "1rem" }}>
                Your site is already deployed on Vercel. We'll show you how to connect your custom domain.
              </p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Access your Vercel dashboard</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Add custom domain (with screenshots)</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Automatic SSL certificate setup</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div style={{
              background: "rgba(0, 255, 0, 0.05)",
              border: "1px solid rgba(0, 255, 0, 0.2)",
              borderRadius: "15px",
              padding: "30px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                top: "-15px",
                left: "30px",
                background: "#00ff00",
                color: "#000",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}>3</div>
              <h3 style={{ marginTop: "10px", marginBottom: "10px", color: "#00ff00" }}>
                Configure DNS
              </h3>
              <p style={{ color: "#e0e0e0", marginBottom: "1rem" }}>
                Simple copy-paste instructions for your domain provider (GoDaddy, Namecheap, etc.)
              </p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Provider-specific guides</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ A-record and CNAME setup</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Propagation timeline (5-30 min)</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div style={{
              background: "rgba(0, 255, 0, 0.05)",
              border: "1px solid rgba(0, 255, 0, 0.2)",
              borderRadius: "15px",
              padding: "30px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                top: "-15px",
                left: "30px",
                background: "#00ff00",
                color: "#000",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}>4</div>
              <h3 style={{ marginTop: "10px", marginBottom: "10px", color: "#00ff00" }}>
                Go Live!
              </h3>
              <p style={{ color: "#e0e0e0", marginBottom: "1rem" }}>
                Final checks and your official launch checklist.
              </p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Test all forms and features</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Submit to Google Search Console</li>
                <li style={{ color: "#a0a0a0", padding: "5px 0" }}>→ Launch announcement templates</li>
              </ul>
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "15px",
            padding: "30px",
            textAlign: "center",
          }}>
            <h3 style={{ color: "#ff00ff", marginBottom: "1rem" }}>
              🎁 Bonus: Post-Launch Support
            </h3>
            <p style={{ color: "#e0e0e0" }}>
              Every Market-Ready Business includes 30 days of email support for technical questions.
              We'll help you with domain issues, minor updates, and launching your marketing campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "2rem",
              color: "#00ffff",
            }}
          >
            Frequently Asked Questions
          </h2>
          <div>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingBottom: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  style={{
                    color: "#ff00ff",
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                  }}
                >
                  {faq.question}
                </h3>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    lineHeight: "1.6",
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        style={{
          background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
          padding: "5rem 2rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            backgroundImage: "linear-gradient(135deg, #00ff00, #00ffff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ready to Launch Your Business?
        </h2>
        <p
          style={{
            fontSize: "1.5rem",
            color: "#fff",
            marginBottom: "1rem",
            maxWidth: "600px",
            margin: "0 auto 1rem",
          }}
        >
          30 minutes from now, you could be live and selling.
        </p>
        <p
          style={{
            fontSize: "1.1rem",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "2rem",
            maxWidth: "700px",
            margin: "0 auto 2rem",
          }}
        >
          Record a voice note about your idea. Get a complete business with live website,
          logos, competitive analysis, and everything you need to start making money today.
        </p>
        <button
          onClick={() => handleSelectTier("TURNKEY_SYSTEM")}
          disabled={loading !== null}
          style={{
            padding: "20px 40px",
            fontSize: "1.3rem",
            background: "linear-gradient(135deg, #00ff00, #00ffff)",
            color: "#000",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: loading !== null ? "wait" : "pointer",
            transition: "all 0.3s",
            opacity: loading !== null ? 0.7 : 1,
          }}
        >
          {loading === "TURNKEY_SYSTEM" ? "Processing..." : "Get Your Market-Ready Business Now →"}
        </button>
        <p
          style={{
            marginTop: "2rem",
            color: "#00ff00",
            fontWeight: "600",
          }}
        >
          100% custom. No templates. Delivered in 30 minutes or your money back.
        </p>
      </section>
    </div>
  );
}

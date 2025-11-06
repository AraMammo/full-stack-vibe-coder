/**
 * BIAB Pricing Page
 *
 * 3-tier comparison layout for Business in a Box packages
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tier {
  id: 'VALIDATION_PACK' | 'LAUNCH_BLUEPRINT' | 'TURNKEY_SYSTEM';
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
    id: 'VALIDATION_PACK',
    name: 'Validation Pack',
    price: 47,
    description: 'Validate your business idea before investing heavily',
    timeline: '15-20 minutes',
    delivery: 'PDF Report',
    features: [
      'Business Model Analysis',
      'Competitive Research',
      'Target Audience Definition',
      'Pricing Strategy',
      'Go-to-Market Plan',
    ],
    cta: 'Start Validation',
  },
  {
    id: 'LAUNCH_BLUEPRINT',
    name: 'Launch Blueprint',
    price: 197,
    badge: 'MOST POPULAR',
    badgeColor: 'bg-purple-500',
    description: 'Complete business plan with brand assets',
    timeline: '45-60 minutes',
    delivery: 'Organized ZIP with Brand Assets',
    features: [
      'Everything in Validation Pack',
      '+ 11 Additional Business Sections',
      '+ 5 Custom Logo Designs',
      '+ Investor Pitch Deck (designed)',
      'Comprehensive Market Analysis',
      'Financial Projections & Budget',
    ],
    cta: 'Launch My Business',
    popular: true,
  },
  {
    id: 'TURNKEY_SYSTEM',
    name: 'Turnkey System',
    price: 497,
    badge: 'COMPLETE SOLUTION',
    badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    description: 'Live website + complete technical infrastructure',
    timeline: '90-120 minutes',
    delivery: 'Live URL + Admin Access',
    features: [
      'Everything in Launch Blueprint',
      '+ Live Website (deployed to Vercel)',
      '+ GitHub Repository (transferred to you)',
      '+ Supabase Backend Setup',
      '+ Stripe Payment Integration',
      '+ Email System Configuration',
      '+ Complete Handoff Documentation',
    ],
    cta: 'Go Turnkey',
  },
];

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What's included in each tier?",
    answer: "Each tier builds upon the previous one. Validation Pack gives you the core business analysis (5 sections). Launch Blueprint adds 11 more sections plus brand assets like logos and a pitch deck. Turnkey System includes everything plus a live, fully-functional website with backend infrastructure.",
  },
  {
    question: 'How long does delivery take?',
    answer: "Validation Pack: 15-20 minutes. Launch Blueprint: 45-60 minutes. Turnkey System: 90-120 minutes. You'll see real-time progress on your dashboard and receive an email when complete.",
  },
  {
    question: 'Can I upgrade later?',
    answer: "Yes! If you start with Validation Pack and want to upgrade to Launch Blueprint or Turnkey System, contact us and we'll apply your original payment as credit toward the upgrade.",
  },
  {
    question: 'What if I need changes?',
    answer: "The AI generates everything based on your voice note. If you need revisions, you can submit a new voice note with clarifications, or contact us for manual adjustments (additional fees may apply for extensive custom work).",
  },
  {
    question: 'Do you offer refunds?',
    answer: "Due to the instant, automated nature of the AI-generated deliverables, all sales are final. However, if there's a technical issue preventing delivery, we'll work with you to resolve it or issue a refund.",
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
        <span className="text-base font-medium text-gray-900">{faq.question}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
    console.log('[Pricing] 🎯 User clicked tier:', tierId);
    setLoading(tierId);
    setError(null);

    try {
      // Call create-checkout API
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('[Pricing] ✓ Checkout session created:', data.sessionId);
      console.log('[Pricing] 🚀 Redirecting to Stripe checkout...');

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (err: any) {
      console.error('[Pricing] ✗ Checkout error:', err.message);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <section className="pricing-page-header">
        <h1 className="pricing-page-title">
          Business in a Box
        </h1>
        <p className="pricing-page-subtitle">
          From idea to launch-ready business. Choose the package that fits your needs.
        </p>
        <p className="pricing-page-subtitle" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
          All packages are AI-generated based on your voice note. No templates, 100% custom.
        </p>
      </section>

      {/* Pricing Cards */}
      <div className="pricing-cards-grid">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`pricing-tier-card ${tier.popular ? 'popular-tier' : ''}`}
          >
            {/* Badge */}
            {tier.badge && tier.popular && (
              <span className="popular-badge">
                {tier.badge}
              </span>
            )}

            {/* Header */}
            <h2 className="tier-name">{tier.name}</h2>
            <div className="tier-price">
              ${tier.price}
              <span className="price-unit"> / one-time</span>
            </div>
            <p className="tier-description">{tier.description}</p>

            {/* Timeline & Delivery */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                <svg style={{ width: '20px', height: '20px', marginRight: '8px', fill: 'none', stroke: 'currentColor' }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Timeline: {tier.timeline}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                <svg style={{ width: '20px', height: '20px', marginRight: '8px', fill: 'none', stroke: 'currentColor' }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Delivery: {tier.delivery}</span>
              </div>
            </div>

            {/* Features */}
            <ul className="tier-features">
              {tier.features.map((feature, idx) => (
                <li key={idx}>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectTier(tier.id)}
              className="pricing-cta-button"
              disabled={loading !== null}
              style={{
                opacity: loading !== null && loading !== tier.id ? 0.5 : 1,
                cursor: loading !== null ? 'wait' : 'pointer',
              }}
            >
              {loading === tier.id ? 'Loading...' : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '600px',
          margin: '2rem auto',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* FAQ Section */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#00ffff' }}>Frequently Asked Questions</h2>
          <div>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ff00ff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{faq.question}</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: 'linear-gradient(45deg, #1a0033, #000)', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(45deg, #ff00ff, #00ffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Ready to start your business?
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Record a voice note about your idea, and get your complete business package delivered in under 2 hours.
        </p>
        <Link
          href="/upload"
          className="pricing-cta-button"
          style={{ display: 'inline-block', maxWidth: '300px' }}
        >
          Get Started Now →
        </Link>
      </section>
    </div>
  );
}

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

  const handleSelectTier = (tierId: string) => {
    console.log('[Pricing] 🎯 User clicked tier:', tierId);

    // Store selected tier in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedTier', tierId);
      console.log('[Pricing] 💾 Tier saved to sessionStorage:', tierId);

      // Verify it was saved
      const verified = sessionStorage.getItem('selectedTier');
      console.log('[Pricing] ✓ Verification - sessionStorage contains:', verified);
    }

    console.log('[Pricing] 🚀 Redirecting to /upload');
    // Redirect to upload page
    router.push('/upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative z-10">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Business in a Box
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From idea to launch-ready business. Choose the package that fits your needs.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              All packages are AI-generated based on your voice note. No templates, 100% custom.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-lg shadow-md border-2 transition-all hover:scale-105 hover:shadow-xl flex flex-col ${
                tier.popular ? 'border-purple-500 relative' : 'border-gray-200'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-block px-4 py-1 rounded-full text-xs font-bold text-white ${tier.badgeColor} shadow-lg`}
                  >
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h2>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                    <span className="text-gray-600"> / one-time</span>
                  </div>
                  <p className="text-sm text-gray-600">{tier.description}</p>
                </div>

                {/* Timeline & Delivery */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Timeline: {tier.timeline}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Delivery: {tier.delivery}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${feature.startsWith('+') ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectTier(tier.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    tier.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
                      : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div>
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start your business?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Record a voice note about your idea, and get your complete business package delivered in under 2 hours.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-gray-900"
          >
            Get Started Now →
          </Link>
        </div>
      </section>
    </div>
  );
}

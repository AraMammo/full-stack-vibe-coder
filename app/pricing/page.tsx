'use client';

import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';

export default function PricingPage() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <div className="noise"></div>
      <div className="grid-overlay"></div>
      
      <div className="pricing-page">
        <div className="pricing-container">
          <div className="pricing-hero">
            <h1 className="pricing-title" data-text="BUSINESS">BUSINESS</h1>
            <h1 className="pricing-title" data-text="IN A BOX">IN A BOX</h1>
            <p className="pricing-headline">Turn Your Idea Into A Live Company In 48 Hours</p>
            <p className="pricing-subtext">
              Record a 5-minute voice note. Get a complete turn-key business: Website. Branding. Business Plan. Marketing. Everything.
            </p>
          </div>

          <div className="price-section">
            <div className="pricing-price-container">
              <div className="pricing-strike">$997</div>
              <div className="pricing-price-main">$297</div>
              <div className="pricing-label">Launch Special - Limited Time</div>
            </div>
            <button className="pricing-cta" onClick={() => router.push('/payment')}>
              <span className="cta-text">Start Your Business Now</span> <span className="cta-arrow">→</span>
            </button>
          </div>

          <div className="pricing-included">
            <h2 className="pricing-included-title">What You Get:</h2>
            <div className="pricing-grid">
              <div className="pricing-item">
                <div className="pricing-check">✓</div>
                <div className="item-content">
                  <div className="item-title">Complete Website</div>
                  <div className="item-desc">Professional, responsive website built to your specifications</div>
                </div>
              </div>
              <div className="pricing-item">
                <div className="pricing-check">✓</div>
                <div className="item-content">
                  <div className="item-title">Brand Identity</div>
                  <div className="item-desc">Logo, color scheme, typography, and brand guidelines</div>
                </div>
              </div>
              <div className="pricing-item">
                <div className="pricing-check">✓</div>
                <div className="item-content">
                  <div className="item-title">Business Plan</div>
                  <div className="item-desc">Comprehensive business strategy and financial projections</div>
                </div>
              </div>
              <div className="pricing-item">
                <div className="pricing-check">✓</div>
                <div className="item-content">
                  <div className="item-title">Marketing Strategy</div>
                  <div className="item-desc">Social media, content, and growth marketing plan</div>
                </div>
              </div>
              <div className="pricing-item">
                <div className="pricing-check">✓</div>
                <div className="item-content">
                  <div className="item-title">48-Hour Delivery</div>
                  <div className="item-desc">Everything delivered in 48 hours or less</div>
                </div>
              </div>
              <div className="pricing-item">
                <div className="pricing-check">✓</div>
                <div className="item-content">
                  <div className="item-title">Full Ownership</div>
                  <div className="item-desc">You own everything - no ongoing fees or subscriptions</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pricing-enterprise">
            <h3 className="pricing-enterprise-title">Need More Than A Startup Kit?</h3>
            <p className="pricing-enterprise-desc">
              We automate entire businesses end-to-end. Compliance systems. Legal tech. Content engines.
              If you&apos;re spending $100K+/year on manual processes, we&apos;ll show you how to cut that by 60% in 90 days.
            </p>
            <div className="pricing-enterprise-pricing">
              <div className="pricing-enterprise-price">Minimum Investment: $20,000</div>
              <div className="pricing-enterprise-range">Average Project: $75,000 - $250,000</div>
            </div>
            <button 
              className="pricing-enterprise-cta"
              onClick={() => {
                try {
                  const event = new CustomEvent('openContactForm', { detail: { subject: 'Enterprise Automation Inquiry' } });
                  window.dispatchEvent(event);
                } catch (error) {
                  console.error('Error dispatching contact form event:', error);
                  router.push('/?contact=true&subject=' + encodeURIComponent('Enterprise Automation Inquiry'));
                }
              }}
            >
              Book Enterprise Consultation →
            </button>
          </div>

          <div className="pricing-back">
            <button className="pricing-back-btn" onClick={() => router.push('/')}>
              ← Back to Agency Services
            </button>
          </div>
        </div>
      </div>

      <div className="pricing-badges">
        <div className="pricing-badge">48 Hours</div>
        <div className="pricing-badge">Zero Meetings</div>
        <div className="pricing-badge">Full Ownership</div>
      </div>
    </>
  );
}
'use client';

import { useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1 className="payment-title" data-text="BUSINESS">BUSINESS</h1>
        <h1 className="payment-title" data-text="IN A BOX">IN A BOX</h1>

        <div className="payment-summary">
          <h2>What You&apos;re Getting:</h2>
          <ul>
            <li>✓ Live Landing Page (Hosted)</li>
            <li>✓ Complete Brand Assets</li>
            <li>✓ Professional Business Plan</li>
            <li>✓ Marketing Copy Package</li>
            <li>✓ Business Model Canvas</li>
            <li>✓ Launch Checklist</li>
          </ul>
          
          <div className="payment-price">
            <span className="price-strike">$997</span>
            <span className="price-main">$297</span>
          </div>

          <p className="payment-guarantee">
            💯 100% Money-Back Guarantee<br/>
            If we don&apos;t deliver in 48 hours, full refund. No questions asked.
          </p>

          {error && <div className="payment-error">{error}</div>}

          <button 
            className="payment-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay $297 & Start Building →'}
          </button>

          <p className="payment-secure">🔒 Secure payment via Stripe</p>
        </div>
      </div>
    </div>
  );
}

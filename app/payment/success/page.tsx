/**
 * Payment Success Page
 *
 * Displays after successful Stripe payment and redirects to upload page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentInfo {
  tier: string;
  tierName: string;
  amount: number;
  email: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID');
      setLoading(false);
      return;
    }

    verifyPayment();
  }, [sessionId]);

  useEffect(() => {
    if (paymentInfo && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (paymentInfo && countdown === 0) {
      // Store tier in sessionStorage and redirect
      sessionStorage.setItem('selectedTier', paymentInfo.tier);
      router.push('/upload');
    }
  }, [paymentInfo, countdown, router]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payment/verify?session_id=${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      setPaymentInfo(data);
      setLoading(false);
    } catch (err: any) {
      console.error('[Payment Success] Verification error:', err);
      setError(err.message || 'Failed to verify payment');
      setLoading(false);
    }
  };

  const getTierDisplayName = (tier: string): string => {
    const tierNames: Record<string, string> = {
      VALIDATION_PACK: 'Validation Pack',
      LAUNCH_BLUEPRINT: 'Launch Blueprint',
      TURNKEY_SYSTEM: 'Turnkey System',
    };
    return tierNames[tier] || tier;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-lg p-8 text-center mb-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Thank you for your purchase
          </p>

          {/* Payment Details */}
          <div className="bg-black/50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Package:</span>
                <span className="font-semibold text-cyan-400">{getTierDisplayName(paymentInfo.tier)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="font-semibold text-green-400">${(paymentInfo.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Email:</span>
                <span className="font-semibold text-white">{paymentInfo.email}</span>
              </div>
            </div>
          </div>

          {/* Auto-redirect Message */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <p className="text-cyan-400">
              Redirecting to upload page in <span className="font-bold text-2xl">{countdown}</span> seconds...
            </p>
          </div>

          {/* Manual Redirect Button */}
          <button
            onClick={() => {
              sessionStorage.setItem('selectedTier', paymentInfo.tier);
              router.push('/upload');
            }}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-green-600 transition-all transform hover:scale-105"
          >
            Continue to Upload →
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">📋 Next Steps:</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
              <span>Record a voice note describing your business idea (1-3 minutes)</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
              <span>Upload any additional context (optional): PDFs, documents, or links</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</span>
              <span>Submit and watch your business plan generate in real-time</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">4</span>
              <span>Download your complete package when finished</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

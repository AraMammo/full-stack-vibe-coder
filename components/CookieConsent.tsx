/**
 * Cookie Consent Banner
 *
 * GDPR-compliant cookie consent banner.
 * Appears on first visit, allows granular control.
 * WCAG 2.1 AA compliant with keyboard navigation.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  hasGivenConsent,
  acceptAllCookies,
  rejectOptionalCookies,
  saveCookieConsent,
  type CookieConsent,
} from '@/lib/cookie-consent';
import Link from 'next/link';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = hasGivenConsent();
    if (!hasConsent) {
      // Small delay to avoid flash on page load
      setTimeout(() => setShowBanner(true), 500);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
  };

  const handleRejectOptional = () => {
    rejectOptionalCookies();
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    saveCookieConsent(preferences);
    setShowBanner(false);
  };

  const handleToggle = (category: 'analytics' | 'functional') => {
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-900 shadow-2xl"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        aria-modal="true"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!showCustomize ? (
            // Main banner
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h2
                    id="cookie-consent-title"
                    className="text-lg font-semibold text-gray-900 mb-2"
                  >
                    Cookie Preferences
                  </h2>
                  <p
                    id="cookie-consent-description"
                    className="text-sm text-gray-700 mb-2"
                  >
                    We use strictly necessary cookies to make our site work. We'd also like to set
                    optional analytics cookies to help us improve it. We won't set optional cookies
                    unless you enable them.
                  </p>
                  <Link
                    href="/cookie-policy"
                    className="text-sm text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
                  >
                    Learn more in our Cookie Policy
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center min-w-max">
                  <button
                    type="button"
                    onClick={() => setShowCustomize(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                  >
                    Customize
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectOptional}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                  >
                    Reject Optional
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Customize view
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Customize Cookie Preferences
                </h2>
                <p className="text-sm text-gray-700">
                  Choose which types of cookies you want to allow. Strictly necessary cookies cannot
                  be disabled as they are essential for the site to function.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Necessary cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex-1 mr-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Strictly Necessary Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      Required for authentication, security, and core functionality. These cannot be
                      disabled.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-6 bg-gray-900 rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-50"
                      aria-label="Strictly necessary cookies always enabled"
                    >
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                    <span className="sr-only">Always enabled</span>
                  </div>
                </div>

                {/* Analytics cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex-1 mr-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Analytics Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      Help us understand how visitors interact with our website to improve user
                      experience. (Currently no analytics configured)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('analytics')}
                    className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                      preferences.analytics ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={preferences.analytics}
                    aria-label="Toggle analytics cookies"
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        preferences.analytics ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Functional cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex-1 mr-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Functional Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      Remember your preferences and settings for a better experience. (Currently no
                      functional cookies used)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('functional')}
                    className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                      preferences.functional ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={preferences.functional}
                    aria-label="Toggle functional cookies"
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        preferences.functional ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCustomize(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

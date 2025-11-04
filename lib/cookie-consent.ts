/**
 * Cookie Consent Management
 *
 * GDPR-compliant cookie consent handling.
 * Stores user preferences and manages consent state.
 */

export interface CookieConsent {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  functional: boolean;
  timestamp: string;
  version: string; // Policy version
}

const CONSENT_VERSION = '1.0';
const CONSENT_COOKIE_NAME = 'cookie-consent';
const CONSENT_DURATION_MONTHS = 12;

/**
 * Get current cookie consent from localStorage
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return null;

    const parsed = JSON.parse(consent) as CookieConsent;

    // Check if consent is expired (12 months)
    const consentDate = new Date(parsed.timestamp);
    const expiryDate = new Date(consentDate);
    expiryDate.setMonth(expiryDate.getMonth() + CONSENT_DURATION_MONTHS);

    if (new Date() > expiryDate) {
      // Consent expired
      localStorage.removeItem('cookie-consent');
      return null;
    }

    // Check if policy version changed
    if (parsed.version !== CONSENT_VERSION) {
      // Policy updated, need new consent
      localStorage.removeItem('cookie-consent');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
}

/**
 * Save cookie consent to localStorage
 */
export function saveCookieConsent(consent: Omit<CookieConsent, 'timestamp' | 'version'>): void {
  if (typeof window === 'undefined') return;

  const fullConsent: CookieConsent = {
    ...consent,
    necessary: true, // Always true
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  try {
    localStorage.setItem('cookie-consent', JSON.stringify(fullConsent));

    // Also set a cookie for server-side detection
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + CONSENT_DURATION_MONTHS);

    document.cookie = `${CONSENT_COOKIE_NAME}=${JSON.stringify(fullConsent)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

    // Trigger analytics setup if enabled
    if (consent.analytics) {
      enableAnalytics();
    }
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
}

/**
 * Check if user has given consent (any consent)
 */
export function hasGivenConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  saveCookieConsent({
    necessary: true,
    analytics: true,
    functional: true,
  });
}

/**
 * Reject optional cookies (only necessary)
 */
export function rejectOptionalCookies(): void {
  saveCookieConsent({
    necessary: true,
    analytics: false,
    functional: false,
  });
}

/**
 * Enable analytics if user consented
 * This is where you would initialize Google Analytics, Plausible, etc.
 */
function enableAnalytics(): void {
  // TODO: Initialize analytics when needed
  // Example for Google Analytics:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('consent', 'update', {
  //     analytics_storage: 'granted'
  //   });
  // }

  console.log('Analytics enabled (no analytics currently configured)');
}

export interface CookieInfo {
  name: string;
  purpose: string;
  duration: string;
  type: string;
}

export interface UsedCookies {
  necessary: CookieInfo[];
  analytics: CookieInfo[];
  functional: CookieInfo[];
}

/**
 * Get list of cookies used by the application
 * For display in cookie policy
 */
export function getUsedCookies(): UsedCookies {
  return {
    necessary: [
      {
        name: 'next-auth.session-token',
        purpose: 'Authentication session management',
        duration: 'Session (30 days)',
        type: 'HTTP Cookie',
      },
      {
        name: 'next-auth.csrf-token',
        purpose: 'CSRF protection for authentication',
        duration: 'Session',
        type: 'HTTP Cookie',
      },
      {
        name: 'cookie-consent',
        purpose: 'Stores your cookie preferences',
        duration: '12 months',
        type: 'HTTP Cookie + LocalStorage',
      },
    ],
    analytics: [
      // Add when analytics is implemented
      // {
      //   name: '_ga',
      //   purpose: 'Google Analytics - distinguish users',
      //   duration: '2 years',
      //   type: 'HTTP Cookie',
      // },
    ],
    functional: [
      // Add when functional cookies are used
      // {
      //   name: 'theme',
      //   purpose: 'Remember your theme preference (light/dark)',
      //   duration: '1 year',
      //   type: 'LocalStorage',
      // },
    ],
  };
}

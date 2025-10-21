/**
 * Cookie Policy Page
 *
 * Comprehensive explanation of cookies used by FullStackVibeCoder.
 * GDPR compliant, accessible, clear language.
 */

import Link from 'next/link';
import { getUsedCookies } from '@/lib/cookie-consent';

export const metadata = {
  title: 'Cookie Policy | FullStackVibeCoder',
  description: 'Learn about the cookies we use and how to manage your preferences.',
};

export default function CookiePolicyPage() {
  const cookies = getUsedCookies();
  const lastUpdated = 'January 20, 2025';

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cookie Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What Are Cookies?
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Cookies are small text files stored on your device (computer, smartphone, tablet) when you
              visit a website. They help websites remember your preferences and understand how you use
              the site.
            </p>
            <p>
              We use cookies to make FullStackVibeCoder work properly and to improve your experience.
              This policy explains what cookies we use and why.
            </p>
          </div>
        </section>

        {/* Cookie Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Cookies We Use
          </h2>

          {/* Necessary Cookies */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Strictly Necessary Cookies
            </h3>
            <p className="text-gray-700 mb-4">
              These cookies are essential for the website to function. Without them, you cannot use
              key features like signing in or submitting projects. These cookies cannot be disabled.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      Cookie Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      Purpose
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cookies.necessary.map((cookie, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {cookie.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cookie.purpose}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cookie.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Cookies */}
          {cookies.analytics.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Analytics Cookies
              </h3>
              <p className="text-gray-700 mb-4">
                These cookies help us understand how visitors use our website. The information is
                anonymous and helps us improve the user experience. You can choose to disable these.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Cookie Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cookies.analytics.map((cookie, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {cookie.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cookie.purpose}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cookie.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Functional Cookies */}
          {cookies.functional.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Functional Cookies
              </h3>
              <p className="text-gray-700 mb-4">
                These cookies remember your preferences (like theme settings) to provide a better
                experience. You can choose to disable these.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Cookie Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cookies.functional.map((cookie, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {cookie.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cookie.purpose}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cookie.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Managing Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Managing Your Cookie Preferences
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              You can control and manage cookies in several ways:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
              On This Website
            </h3>
            <p>
              Use the cookie settings link in the footer to change your preferences at any time.
              Your choice will be remembered for 12 months.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
              In Your Browser
            </h3>
            <p>
              Most browsers allow you to view, manage, and delete cookies. Here's how:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
              </li>
              <li>
                <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
              </li>
              <li>
                <strong>Edge:</strong> Settings → Cookies and site permissions → Manage cookies
              </li>
            </ul>

            <p className="mt-4">
              Note: Blocking strictly necessary cookies will prevent you from using key features
              like signing in.
            </p>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Third-Party Cookies
          </h2>
          <p className="text-gray-700">
            We do not currently use any third-party cookies for advertising or tracking. If we add
            analytics in the future (like Google Analytics), we will update this policy and request
            your consent.
          </p>
        </section>

        {/* Updates */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Updates to This Policy
          </h2>
          <p className="text-gray-700">
            We may update this Cookie Policy from time to time. When we make significant changes,
            we'll ask for your consent again. The "Last updated" date at the top shows when this
            policy was last revised.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Questions?
          </h2>
          <p className="text-gray-700">
            If you have questions about our use of cookies, please contact us at{' '}
            <a
              href="mailto:privacy@fullstackvibecoder.com"
              className="text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
            >
              privacy@fullstackvibecoder.com
            </a>
          </p>
        </section>

        {/* Related Links */}
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Related Policies
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy-policy"
              className="text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
            >
              Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy for FullStackVibeCoder.
 */

import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | FullStackVibeCoder',
  description: 'How we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-gray-700 mb-4">
            FullStackVibeCoder ("we," "our," or "us") is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our website and services.
          </p>
          <p className="text-gray-700">
            By using our service, you agree to the collection and use of information in accordance
            with this policy. If you do not agree, please do not use our service.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Information We Collect
          </h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            Information You Provide
          </h3>
          <p className="text-gray-700 mb-4">
            When you create an account or use our services, you may provide:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700 mb-4">
            <li>Name and email address (for authentication)</li>
            <li>Voice recordings (when you submit project ideas)</li>
            <li>Project details and requirements</li>
            <li>Payment information (processed securely by Stripe)</li>
            <li>Communication with our support team</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            Automatically Collected Information
          </h3>
          <p className="text-gray-700 mb-4">
            When you use our website, we automatically collect:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700 mb-4">
            <li>Log data (IP address, browser type, pages visited, time spent)</li>
            <li>Cookies and similar technologies (see our Cookie Policy)</li>
            <li>Device information (device type, operating system)</li>
          </ul>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            How We Use Your Information
          </h2>
          <p className="text-gray-700 mb-4">
            We use your information to:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Provide and maintain our service</li>
            <li>Process your project submissions and generate proposals</li>
            <li>Authenticate your account and prevent fraud</li>
            <li>Process payments (through Stripe)</li>
            <li>Communicate with you about your projects and account</li>
            <li>Improve our service and develop new features</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* AI Processing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            AI Processing
          </h2>
          <p className="text-gray-700 mb-4">
            We use AI services (OpenAI and Anthropic) to process your voice recordings and generate
            project proposals. Your data is sent to these third-party providers for processing.
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>
              <strong>OpenAI:</strong> Processes voice recordings for transcription using Whisper API
            </li>
            <li>
              <strong>Anthropic (Claude):</strong> Processes transcripts to generate project
              proposals and code
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            These providers have their own privacy policies. We recommend reviewing them:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700 mt-2">
            <li>
              <a
                href="https://openai.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 underline hover:text-gray-700"
              >
                OpenAI Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 underline hover:text-gray-700"
              >
                Anthropic Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        {/* Data Sharing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            How We Share Your Information
          </h2>
          <p className="text-gray-700 mb-4">
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>
              <strong>Service Providers:</strong> OpenAI (transcription), Anthropic (AI processing),
              Stripe (payments), Supabase (data storage)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger or acquisition
            </li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Data Security
          </h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures to protect your data:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Secure database storage with access controls</li>
            <li>Regular security audits and updates</li>
            <li>Limited employee access to personal data</li>
          </ul>
          <p className="text-gray-700 mt-4">
            However, no method of transmission or storage is 100% secure. We cannot guarantee
            absolute security.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Your Rights (GDPR)
          </h2>
          <p className="text-gray-700 mb-4">
            If you are in the EU/EEA, you have the following rights:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>
              <strong>Access:</strong> Request a copy of your personal data
            </li>
            <li>
              <strong>Rectification:</strong> Request correction of inaccurate data
            </li>
            <li>
              <strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")
            </li>
            <li>
              <strong>Restriction:</strong> Request limitation of processing
            </li>
            <li>
              <strong>Portability:</strong> Receive your data in a machine-readable format
            </li>
            <li>
              <strong>Object:</strong> Object to processing of your data
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Withdraw consent at any time
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            To exercise these rights, contact us at{' '}
            <a
              href="mailto:privacy@fullstackvibecoder.com"
              className="text-gray-900 underline hover:text-gray-700"
            >
              privacy@fullstackvibecoder.com
            </a>
          </p>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Data Retention
          </h2>
          <p className="text-gray-700">
            We retain your personal data for as long as necessary to provide our services and comply
            with legal obligations. When you delete your account, we will delete or anonymize your
            personal data within 30 days, except where required to keep it for legal reasons.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Children's Privacy
          </h2>
          <p className="text-gray-700">
            Our service is not intended for children under 18. We do not knowingly collect personal
            information from children. If you believe we have collected information from a child,
            please contact us immediately.
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Changes to This Policy
          </h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by email or a notice on our website. Your continued use of the service after
            changes constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this Privacy Policy or our data practices:
          </p>
          <p className="text-gray-700">
            Email:{' '}
            <a
              href="mailto:privacy@fullstackvibecoder.com"
              className="text-gray-900 underline hover:text-gray-700"
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
              href="/cookie-policy"
              className="text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
            >
              Cookie Policy
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

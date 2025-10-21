/**
 * Terms of Service Page
 *
 * Legal terms for using FullStackVibeCoder services.
 */

import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | FullStackVibeCoder',
  description: 'Legal terms and conditions for using our service.',
};

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-gray-700 mb-4">
            These Terms of Service ("Terms") govern your use of FullStackVibeCoder's website and
            services. By using our service, you agree to these Terms. If you disagree with any part,
            you may not use our service.
          </p>
        </section>

        {/* Service Description */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Service Description
          </h2>
          <p className="text-gray-700 mb-4">
            FullStackVibeCoder provides AI-powered software development services, including:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Voice-to-proposal conversion for project ideas</li>
            <li>Automated project scoping and estimation</li>
            <li>AI-generated code and project deliverables</li>
            <li>Project management and tracking</li>
          </ul>
        </section>

        {/* Account Registration */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Account Registration
          </h2>
          <p className="text-gray-700 mb-4">
            To use our service, you must:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Be at least 18 years old</li>
            <li>Provide accurate and complete information</li>
            <li>Keep your account credentials secure</li>
            <li>Notify us immediately of unauthorized access</li>
            <li>Be responsible for all activity under your account</li>
          </ul>
        </section>

        {/* Acceptable Use */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Acceptable Use
          </h2>
          <p className="text-gray-700 mb-4">
            You agree NOT to:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Use our service for any illegal purpose</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Upload malicious code or viruses</li>
            <li>Attempt to bypass security measures</li>
            <li>Reverse engineer our service</li>
            <li>Use our service to compete with us</li>
            <li>Scrape or harvest data without permission</li>
          </ul>
        </section>

        {/* AI-Generated Content */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            AI-Generated Content
          </h2>
          <p className="text-gray-700 mb-4">
            Our service uses AI to generate proposals and code. You acknowledge that:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>AI-generated content may not be perfect and requires human review</li>
            <li>You are responsible for reviewing and testing all deliverables</li>
            <li>We do not guarantee that AI-generated code will be bug-free</li>
            <li>You should conduct your own quality assurance before deployment</li>
            <li>AI responses may occasionally produce unexpected results</li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Intellectual Property
          </h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            Your Content
          </h3>
          <p className="text-gray-700 mb-4">
            You retain all rights to content you submit (voice recordings, project descriptions,
            etc.). By using our service, you grant us a license to use your content solely to provide
            our services.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            Generated Deliverables
          </h3>
          <p className="text-gray-700 mb-4">
            Code and deliverables generated by our service are yours to use. However, some generated
            code may include third-party libraries or components with their own licenses, which you
            must comply with.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            Our Platform
          </h3>
          <p className="text-gray-700">
            The FullStackVibeCoder platform, including our website, AI models, and proprietary
            technology, is our intellectual property. You may not copy, modify, or create derivative
            works of our platform.
          </p>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Payment Terms
          </h2>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Prices are listed in USD and subject to change with notice</li>
            <li>Payments are processed securely through Stripe</li>
            <li>All sales are final unless otherwise stated</li>
            <li>You are responsible for any taxes applicable to your purchase</li>
            <li>We reserve the right to refuse service for non-payment</li>
          </ul>
        </section>

        {/* Refund Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Refund Policy
          </h2>
          <p className="text-gray-700 mb-4">
            Refunds are evaluated on a case-by-case basis. To request a refund:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Contact us within 7 days of purchase</li>
            <li>Provide a clear explanation of the issue</li>
            <li>Allow us to attempt to resolve the problem first</li>
          </ul>
          <p className="text-gray-700 mt-4">
            We do not offer refunds for services already delivered and accepted.
          </p>
        </section>

        {/* Disclaimers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Disclaimers
          </h2>
          <p className="text-gray-700 mb-4 uppercase">
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          </p>
          <p className="text-gray-700 mb-4">
            We disclaim all warranties, including but not limited to:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Merchantability and fitness for a particular purpose</li>
            <li>Uninterrupted or error-free operation</li>
            <li>Accuracy or reliability of results</li>
            <li>Defects will be corrected</li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Limitation of Liability
          </h2>
          <p className="text-gray-700 mb-4">
            To the maximum extent permitted by law, FullStackVibeCoder shall not be liable for:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Damages exceeding the amount you paid us in the past 12 months</li>
          </ul>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Termination
          </h2>
          <p className="text-gray-700 mb-4">
            We may terminate or suspend your account immediately if you:
          </p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Violate these Terms</li>
            <li>Engage in fraudulent activity</li>
            <li>Fail to pay for services</li>
            <li>Use the service in a way that harms us or others</li>
          </ul>
          <p className="text-gray-700 mt-4">
            You may terminate your account at any time by contacting us.
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Changes to Terms
          </h2>
          <p className="text-gray-700">
            We may update these Terms from time to time. We will notify you of significant changes
            by email or a notice on our website. Your continued use after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        {/* Governing Law */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Governing Law
          </h2>
          <p className="text-gray-700">
            These Terms are governed by the laws of Ontario, Canada, without regard to conflict of
            law provisions. Any disputes will be resolved in the courts of Ontario.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-700 mb-4">
            If you have questions about these Terms:
          </p>
          <p className="text-gray-700">
            Email:{' '}
            <a
              href="mailto:legal@fullstackvibecoder.com"
              className="text-gray-900 underline hover:text-gray-700"
            >
              legal@fullstackvibecoder.com
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
              href="/cookie-policy"
              className="text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
            >
              Cookie Policy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

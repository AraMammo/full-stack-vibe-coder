/**
 * ShipKit Free Tier Preview Page
 *
 * Public page (no auth required) — the free tier deliverable.
 * Renders an interactive business brief with the analysis results.
 */

import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface BusinessName {
  name: string;
  tagline: string;
}

interface AudienceSegment {
  segment: string;
  description: string;
}

interface Analysis {
  businessNames?: BusinessName[];
  valueProposition?: string;
  targetAudience?: AudienceSegment[];
  competitivePositioning?: string;
  sitePreviewHtml?: string;
  message?: string;
}

export default async function ShipKitPreviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: {
      id: true,
      projectName: true,
      biabTier: true,
      businessConcept: true,
      status: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Try to find the analysis from chat_submissions or prompt executions
  let analysis: Analysis | null = null;

  // Check prompt executions for the business brief output
  const briefExecution = await prisma.promptExecution.findFirst({
    where: {
      projectId: project.id,
      prompt: {
        promptId: {
          in: ['sk_business_brief_01', 'business_overview_01'],
        },
      },
    },
    orderBy: { executedAt: 'desc' },
  });

  if (briefExecution?.output) {
    try {
      analysis = JSON.parse(briefExecution.output);
    } catch {
      // Output isn't JSON, use it as text
    }
  }

  // Fallback: check chat_submissions for analysis_json
  if (!analysis) {
    const chatSubmission = await prisma.chat_submissions.findFirst({
      where: {
        user_input: {
          contains: project.businessConcept.substring(0, 50),
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (chatSubmission?.analysis_json) {
      analysis = chatSubmission.analysis_json as unknown as Analysis;
    }
  }

  const businessNames = analysis?.businessNames || [];
  const valueProposition = analysis?.valueProposition || '';
  const targetAudience = analysis?.targetAudience || [];
  const competitivePositioning = analysis?.competitivePositioning || '';
  const sitePreviewHtml = analysis?.sitePreviewHtml || '';

  return (
    <main className="min-h-screen bg-black pt-20 pb-16">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            ShipKit Lite - Business Brief
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {project.projectName}
          </h1>
          <p className="mt-3 text-gray-400">
            Your AI-generated business brief is ready
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-10">
        {/* Business Names */}
        {businessNames.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Business Name Options
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {businessNames.map((bn, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-pink-500/50 hover:bg-white/10"
                >
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Option {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white">{bn.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{bn.tagline}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Value Proposition */}
        {valueProposition && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Value Proposition
            </h2>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <p className="text-lg leading-relaxed text-cyan-100">
                {valueProposition}
              </p>
            </div>
          </section>
        )}

        {/* Target Audience */}
        {targetAudience.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Target Audience
            </h2>
            <div className="space-y-3">
              {targetAudience.map((seg, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <h3 className="font-semibold text-white">{seg.segment}</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {seg.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Competitive Positioning */}
        {competitivePositioning && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Competitive Positioning
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="leading-relaxed text-gray-300">
                {competitivePositioning}
              </p>
            </div>
          </section>
        )}

        {/* Site Preview */}
        {sitePreviewHtml && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Site Preview
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div
                className="bg-white"
                dangerouslySetInnerHTML={{ __html: sitePreviewHtml }}
              />
            </div>
          </section>
        )}

        {/* No analysis fallback */}
        {!analysis && (
          <div className="py-12 text-center">
            <p className="text-gray-400">
              Your business brief is being generated. Check back soon!
            </p>
          </div>
        )}

        {/* Upgrade CTA */}
        <section className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-transparent to-cyan-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Ready to build your full business?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-gray-400">
            Upgrade to ShipKit Pro or Complete to get brand identity, marketing strategy,
            financial projections, and a full deployable codebase.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get Your Full ShipKit
              <span>&#8594;</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

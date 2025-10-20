/**
 * Proposal Detail Page
 *
 * Displays AI-generated proposal with approval/revision actions
 */

import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';
import { ProposalActions } from './ProposalActions';

export default async function ProposalPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // Fetch proposal
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      workflow: {
        include: {
          voiceNote: {
            select: {
              transcript: true,
              createdAt: true,
            },
          },
        },
      },
      approvals: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      project: {
        select: {
          id: true,
          status: true,
          progress: true,
        },
      },
    },
  });

  if (!proposal) {
    notFound();
  }

  // Verify ownership
  if (proposal.userId !== session.user.id) {
    redirect('/dashboard');
  }

  // Parse proposal content
  const content = proposal.content as any;

  // Check if already approved
  const isApproved = proposal.status === 'approved';
  const isPending = proposal.status === 'pending_review';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
            <StatusBadge status={proposal.status} type="proposal" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generated on {new Date(proposal.createdAt).toLocaleDateString()} • Version {proposal.version}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Summary */}
        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.summary}</p>
          </div>
        </section>

        {/* Client Goals */}
        {content.clientGoals && content.clientGoals.length > 0 && (
          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Goals</h2>
            <ul className="space-y-2">
              {content.clientGoals.map((goal: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">{goal}</span>
                </li>
              ))}
            </ul>
            {content.targetOutcome && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900">Target Outcome:</p>
                <p className="mt-1 text-gray-700">{content.targetOutcome}</p>
              </div>
            )}
          </section>
        )}

        {/* Deliverables */}
        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">What You'll Receive</h2>
          <div className="space-y-6">
            {content.deliverables?.map((deliverable: any, index: number) => (
              <div key={index} className="border-l-4 border-gray-900 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {deliverable.name}
                </h3>
                <p className="text-gray-700 mb-3">{deliverable.description}</p>
                {deliverable.features && deliverable.features.length > 0 && (
                  <ul className="space-y-1">
                    {deliverable.features.map((feature: string, fIndex: number) => (
                      <li key={fIndex} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {deliverable.timeline && (
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    Timeline: {deliverable.timeline}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Investment */}
        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Investment</h2>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-medium text-gray-900">Total Investment</span>
              <span className="text-3xl font-bold text-gray-900">
                ${(content.investment.totalCost / 100).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          {content.investment.breakdown && content.investment.breakdown.length > 0 && (
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-900">Cost Breakdown:</p>
              {content.investment.breakdown.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.item}</span>
                  <span className="font-medium text-gray-900">
                    ${(item.cost / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Terms */}
          {content.investment.paymentTerms && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Payment Terms:</p>
              <p className="text-sm text-gray-700">{content.investment.paymentTerms}</p>
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Timeline</h2>

          <div className="mb-6">
            <p className="text-2xl font-bold text-gray-900">
              {content.timeline.totalDays} days
            </p>
            <p className="text-sm text-gray-600">from approval to delivery</p>
          </div>

          {/* Milestones */}
          {content.timeline.milestones && content.timeline.milestones.length > 0 && (
            <div className="space-y-4">
              {content.timeline.milestones.map((milestone: any, index: number) => (
                <div key={index} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-medium">
                      {milestone.day}
                    </div>
                    {index < content.timeline.milestones.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 mt-2" />
                    )}
                  </div>
                  <div className="pb-8 flex-1">
                    <p className="font-medium text-gray-900">{milestone.name}</p>
                    {milestone.deliverables && milestone.deliverables.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {milestone.deliverables.map((deliverable: string, dIndex: number) => (
                          <li key={dIndex} className="text-sm text-gray-600">
                            • {deliverable}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Next Steps */}
        {content.nextSteps && content.nextSteps.length > 0 && (
          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
            <ol className="space-y-3">
              {content.nextSteps.map((step: string, index: number) => (
                <li key={index} className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Terms */}
        {content.terms && content.terms.length > 0 && (
          <section className="bg-gray-50 rounded-lg border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {content.terms.map((term: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Action Buttons */}
        {isPending && (
          <ProposalActions proposalId={proposal.id} />
        )}

        {isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Proposal Approved!</h3>
            <p className="text-green-700 mb-4">
              Your project has been approved and is now being prepared for execution.
            </p>
            {proposal.project && (
              <Link
                href={`/project/${proposal.project.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                View Project Status →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

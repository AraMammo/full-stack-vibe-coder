/**
 * Client Dashboard
 *
 * Overview of all projects, workflows, and proposals for authenticated user
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatusBadge } from '@/components/StatusBadge';
import { BIABProjectCard } from '@/components/BIABProjectCard';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // Fetch user's BIAB projects
  const biabProjects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  // Workflow model not yet implemented - return empty data
  // TODO: Uncomment when Workflow model is added to Prisma schema
  /*
  const workflows = await prisma.workflow.findMany({
    where: { userId: session.user.id },
    include: {
      voiceNote: {
        select: {
          fileName: true,
          createdAt: true,
        },
      },
      proposal: {
        select: {
          id: true,
          title: true,
          status: true,
          estimatedCost: true,
          estimatedDays: true,
        },
      },
      project: {
        select: {
          id: true,
          status: true,
          progress: true,
        },
      },
      steps: {
        select: {
          agentName: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  */

  const workflows: any[] = [];

  // Calculate progress for each workflow
  const workflowsWithProgress = workflows.map((workflow: any) => {
    const totalSteps = 4; // intake, scope, estimator, proposal
    const completedSteps = workflow.steps?.filter((s: any) => s.status === 'completed').length || 0;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return {
      ...workflow,
      progress,
    };
  });

  // Calculate stats
  const stats = {
    total: workflows.length + biabProjects.length,
    processing: workflows.filter(w => w.status === 'in_progress' || w.status === 'pending').length +
                biabProjects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'PENDING').length,
    ready: workflows.filter(w => w.proposal?.status === 'pending_review').length,
    approved: workflows.filter(w => w.proposal?.status === 'approved').length +
              biabProjects.filter(p => p.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {session.user.name || session.user.email}
              </p>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              + New Project
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            label="Total Projects"
            value={stats.total}
            icon="📊"
          />
          <StatsCard
            label="Processing"
            value={stats.processing}
            icon="⚙️"
            highlight={stats.processing > 0}
          />
          <StatsCard
            label="Ready to Review"
            value={stats.ready}
            icon="📄"
            highlight={stats.ready > 0}
          />
          <StatsCard
            label="Approved"
            value={stats.approved}
            icon="✅"
          />
        </div>

        {/* BIAB Projects */}
        {biabProjects.length > 0 && (
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Business in a Box Projects</h2>
              <p className="text-sm text-gray-600">AI-generated business packages with real-time progress tracking</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {biabProjects.map((project) => (
                <BIABProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Workflows List */}
        {workflows.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Custom Projects</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {workflowsWithProgress.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {workflows.length === 0 && biabProjects.length === 0 && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">
                Ready to start your business? Choose a package and get started.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/get-started"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  View Pricing
                </Link>
                <Link
                  href="/upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Upload Voice Note
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white overflow-hidden shadow-sm rounded-lg border ${
        highlight ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-3xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-600 truncate">{label}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Workflow Card Component
function WorkflowCard({ workflow }: { workflow: any }) {
  const hasProposal = !!workflow.proposal;
  const isComplete = workflow.status === 'completed';
  const isFailed = workflow.status === 'failed';

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {workflow.proposal?.title || workflow.voiceNote.fileName || 'Untitled Project'}
            </h3>
            <StatusBadge status={workflow.status} type="workflow" />
            {hasProposal && (
              <StatusBadge status={workflow.proposal.status} type="proposal" />
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Created {new Date(workflow.voiceNote.createdAt).toLocaleDateString()}
            </span>
            {hasProposal && (
              <>
                <span>•</span>
                <span>${(workflow.proposal.estimatedCost / 100).toFixed(0)}</span>
                <span>•</span>
                <span>{workflow.proposal.estimatedDays} days</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {!isComplete && !isFailed && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>
                  {workflow.status === 'in_progress' ? 'Generating proposal...' : 'Queued'}
                </span>
                <span>{workflow.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${workflow.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {isFailed && workflow.errorMessage && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
              Error: {workflow.errorMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-6 flex-shrink-0">
          {hasProposal && (
            <Link
              href={`/proposal/${workflow.proposal.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              View Proposal →
            </Link>
          )}
          {workflow.project && (
            <Link
              href={`/project/${workflow.project.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ml-2"
            >
              View Project →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

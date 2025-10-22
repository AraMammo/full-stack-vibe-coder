/**
 * BIAB Project Detail Page
 *
 * Shows detailed view of all prompt executions with real-time progress
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatusBadge } from '@/components/StatusBadge';
import { ProjectDetailClient } from './ProjectDetailClient';
import Link from 'next/link';

const tierConfig = {
  VALIDATION_PACK: {
    name: 'Validation Pack',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  LAUNCH_BLUEPRINT: {
    name: 'Launch Blueprint',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  TURNKEY_SYSTEM: {
    name: 'Turnkey System',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // Fetch project
  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!project) {
    redirect('/dashboard');
  }

  // Fetch all prompt executions
  const executions = await prisma.promptExecution.findMany({
    where: { projectId: params.id },
    include: {
      prompt: {
        select: {
          promptName: true,
          promptSection: true,
          orderIndex: true,
        },
      },
    },
    orderBy: {
      prompt: {
        orderIndex: 'asc',
      },
    },
  });

  const tierInfo = tierConfig[project.biabTier];
  const isCompleted = project.status === 'COMPLETED';
  const isInProgress = project.status === 'IN_PROGRESS' || project.status === 'PENDING';

  // Calculate estimated time remaining
  const totalPrompts = project.totalPrompts || executions.length;
  const completedPrompts = project.completedPrompts;
  const remainingPrompts = totalPrompts - completedPrompts;
  const avgTimePerPrompt = 2; // minutes
  const estimatedMinutesRemaining = remainingPrompts * avgTimePerPrompt;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-flex items-center"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{project.projectName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${tierInfo.color}`}>
                {tierInfo.name}
              </span>
              <StatusBadge status={project.status} type="project" />
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress: {project.completedPrompts}/{totalPrompts} sections complete
              </span>
              <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
              role="progressbar"
              aria-valuenow={project.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            {isInProgress && estimatedMinutesRemaining > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                Estimated completion: ~{estimatedMinutesRemaining} minutes remaining
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Component for Real-Time Updates */}
        <ProjectDetailClient projectId={params.id} initialExecutions={executions} isInProgress={isInProgress} />

        {/* Download Button */}
        {isCompleted && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">Your package is ready!</h3>
                <p className="text-sm text-green-700">
                  All sections have been completed. Download your complete package.
                </p>
              </div>
              <Link
                href={`/api/delivery/${params.id}/download`}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download Complete Package
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

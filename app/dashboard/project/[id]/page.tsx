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
    redirect('/auth/signin');
  }

  // Fetch project
  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    select: {
      id: true,
      projectName: true,
      biabTier: true,
      status: true,
      progress: true,
      completedPrompts: true,
      totalPrompts: true,
      createdAt: true,
      v0ChatId: true,
      v0PreviewUrl: true,
      v0DeployUrl: true,
      v0GeneratedAt: true,
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
        {/* v0 Deployment Banner (if available) */}
        {isCompleted && (project.v0PreviewUrl || project.v0DeployUrl) && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  🚀 Your Website is Live on v0!
                </h3>
                <p className="text-sm text-purple-700 mb-4 leading-relaxed">
                  Your Next.js application has been automatically generated and deployed using AI.
                  You can view the live site, make refinements through the v0 chat interface,
                  and deploy updates instantly to Vercel.
                </p>
                <div className="flex flex-wrap gap-3">
                  {project.v0DeployUrl && (
                    <a
                      href={project.v0DeployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Live Site
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {project.v0PreviewUrl && (
                    <a
                      href={project.v0PreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-5 py-2.5 bg-white border-2 border-purple-400 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-all shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit in v0 Chat
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                {project.v0GeneratedAt && (
                  <p className="text-xs text-purple-600 mt-3 font-medium">
                    Generated {new Date(project.v0GeneratedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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

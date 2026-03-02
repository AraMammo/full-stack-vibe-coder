/**
 * ShipKit Project Detail Page
 *
 * Shows detailed view of all prompt executions with real-time progress.
 * For deployed apps, shows hosting status, live URL, Stripe Connect, and domain management.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatusBadge } from '@/components/StatusBadge';
import { ProjectDetailClient } from './ProjectDetailClient';
import { ShipKitReady } from '@/components/ShipKitReady';
import Link from 'next/link';

const tierConfig = {
  VALIDATION_PACK: {
    name: 'ShipKit Lite',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  LAUNCH_BLUEPRINT: {
    name: 'ShipKit Pro',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  TURNKEY_SYSTEM: {
    name: 'ShipKit Complete',
    color: 'bg-pink-100 text-pink-700 border-pink-300',
  },
};

const hostingStatusConfig: Record<string, { label: string; color: string }> = {
  PROVISIONING: { label: 'Provisioning', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-300' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  EJECTED: { label: 'Ejected', color: 'bg-blue-100 text-blue-700 border-blue-300' },
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch project with deployed app data
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
      githubRepoUrl: true,
      vercelDeploymentUrl: true,
      deployedApp: {
        select: {
          id: true,
          hostingStatus: true,
          vercelProductionUrl: true,
          githubRepoUrl: true,
          githubRepoFullName: true,
          stripeConnectAccountId: true,
          stripeConnectOnboarded: true,
          customDomain: true,
          domainVerified: true,
          provisioningLog: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
            },
          },
        },
      },
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
  const deployedApp = project.deployedApp;

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
                &larr; Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{project.projectName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${tierInfo.color}`}>
                {tierInfo.name}
              </span>
              <StatusBadge status={project.status} type="project" />
              {deployedApp && (
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${hostingStatusConfig[deployedApp.hostingStatus]?.color || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                  {hostingStatusConfig[deployedApp.hostingStatus]?.label || deployedApp.hostingStatus}
                </span>
              )}
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
        {/* Celebration Banner for completed projects */}
        {isCompleted && (
          <ShipKitReady
            projectId={params.id}
            projectName={project.projectName}
            liveSiteUrl={deployedApp?.vercelProductionUrl || project.vercelDeploymentUrl || undefined}
            githubRepoUrl={deployedApp?.githubRepoUrl || project.githubRepoUrl || undefined}
            downloadUrl={`/api/delivery/${params.id}/download`}
            hostingStatus={deployedApp?.hostingStatus}
          />
        )}

        {/* Deployed App Management Panel */}
        {deployedApp && deployedApp.hostingStatus !== 'PROVISIONING' && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">App Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Live URL */}
              {deployedApp.vercelProductionUrl && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Live URL</p>
                  <a
                    href={deployedApp.vercelProductionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-800 font-medium hover:underline break-all"
                  >
                    {deployedApp.vercelProductionUrl}
                  </a>
                </div>
              )}

              {/* Custom Domain */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Custom Domain</p>
                {deployedApp.customDomain ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium">{deployedApp.customDomain}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${deployedApp.domainVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {deployedApp.domainVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not configured</p>
                )}
              </div>

              {/* Stripe Connect */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Payments (Stripe Connect)</p>
                {deployedApp.stripeConnectOnboarded ? (
                  <span className="text-sm text-green-700 font-medium">Connected</span>
                ) : deployedApp.stripeConnectAccountId ? (
                  <span className="text-sm text-yellow-700 font-medium">Setup Incomplete</span>
                ) : (
                  <span className="text-sm text-gray-500">Not configured</span>
                )}
              </div>

              {/* GitHub Repo */}
              {deployedApp.githubRepoUrl && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">GitHub Repository</p>
                  <a
                    href={deployedApp.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    {deployedApp.githubRepoFullName || 'View Repo'}
                  </a>
                </div>
              )}

              {/* Hosting Subscription */}
              {deployedApp.subscription && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Hosting Plan</p>
                  <p className="text-sm text-gray-800 font-medium">
                    $49/mo &mdash; {deployedApp.subscription.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Renews {new Date(deployedApp.subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-3">
              {deployedApp.vercelProductionUrl && (
                <a
                  href={deployedApp.vercelProductionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Visit Live App
                </a>
              )}
              {deployedApp.hostingStatus === 'ACTIVE' && (
                <Link
                  href={`/api/project/${params.id}/eject`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Eject &amp; Self-Host
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Provisioning Progress (when still provisioning) */}
        {deployedApp && deployedApp.hostingStatus === 'PROVISIONING' && deployedApp.provisioningLog && (
          <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
            <h2 className="text-lg font-bold text-yellow-800 mb-4">Deploying Your App...</h2>
            <div className="space-y-2">
              {(deployedApp.provisioningLog as Array<{ step: string; status: string; timestamp: string }>).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.status === 'completed' ? 'bg-green-500' :
                    entry.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                    entry.status === 'failed' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-gray-700 capitalize">{entry.step.replace(/_/g, ' ')}</span>
                  <span className={`text-xs ${
                    entry.status === 'completed' ? 'text-green-600' :
                    entry.status === 'running' ? 'text-yellow-600' :
                    entry.status === 'failed' ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client Component for Real-Time Updates */}
        <ProjectDetailClient projectId={params.id} initialExecutions={executions} isInProgress={isInProgress} />
      </main>
    </div>
  );
}

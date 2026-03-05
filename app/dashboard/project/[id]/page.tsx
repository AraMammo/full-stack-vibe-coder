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
import { EjectButton } from './EjectButton';
import { TransferButton } from './TransferButton';
import { BillingButton } from './BillingButton';
import { UpgradeSection } from './UpgradeSection';
import { ChangeRequestPanel } from './ChangeRequestPanel';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import BuildProgressView from '@/components/BuildProgressView';
import { RetryButton } from './RetryButton';
import Link from 'next/link';

const tierConfig: Record<string, { name: string; color: string }> = {
  VALIDATION_PACK: {
    name: 'ShipKit Lite',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  },
  LAUNCH_BLUEPRINT: {
    name: 'ShipKit Pro',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  TURNKEY_SYSTEM: {
    name: 'ShipKit Complete',
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  PRESENCE: {
    name: 'ShipKit Presence',
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
};

const hostingStatusConfig: Record<string, { label: string; color: string }> = {
  PROVISIONING: { label: 'Provisioning', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ACTIVE: { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  EJECTED: { label: 'Ejected', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  TRANSFERRED: { label: 'Transferred', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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
          stripeConnectOnboardingUrl: true,
          customDomain: true,
          domainVerified: true,
          provisioningLog: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              plan: true,
              currentPeriodEnd: true,
            },
          },
          transfers: {
            orderBy: { createdAt: 'desc' as const },
            take: 1,
            select: {
              id: true,
              status: true,
              githubTransferred: true,
              vercelTransferred: true,
              neonTransferred: true,
              stripeDisconnected: true,
              githubTransferUrl: true,
              neonClaimUrl: true,
              vercelReimportUrl: true,
              customerEmail: true,
              createdAt: true,
              completedAt: true,
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

  // Check if any change requests exist for this project
  const changeRequestCount = await prisma.changeRequest.count({
    where: { projectId: params.id },
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white mb-2 inline-flex items-center transition-colors"
              >
                &larr; Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white mt-2">{project.projectName}</h1>
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
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                Overall Progress: {project.completedPrompts}/{totalPrompts} sections complete
              </span>
              <span className="text-sm font-semibold text-white">{project.progress}%</span>
            </div>
            <div
              className="w-full bg-white/10 rounded-full h-3 overflow-hidden"
              role="progressbar"
              aria-valuenow={project.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-gradient-to-r from-pink-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            {isInProgress && estimatedMinutesRemaining > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Estimated completion: ~{estimatedMinutesRemaining} minutes remaining
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Build Progress View for in-progress projects */}
        {isInProgress && (
          <BuildProgressView
            projectId={params.id}
            projectName={project.projectName}
          />
        )}

        {/* Failed Project — Retry Panel */}
        {project.status === 'FAILED' && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <h2 className="text-lg font-bold text-red-400 mb-2">Build Failed</h2>
            <p className="text-sm text-gray-400 mb-4">
              Something went wrong during the build. You can retry without being charged again.
            </p>
            <RetryButton projectId={params.id} />
          </div>
        )}

        {/* Celebration Banner for completed projects */}
        {isCompleted && (
          <ShipKitReady
            projectId={params.id}
            projectName={project.projectName}
            liveSiteUrl={deployedApp?.vercelProductionUrl || project.vercelDeploymentUrl || undefined}
            githubRepoUrl={deployedApp?.githubRepoUrl || project.githubRepoUrl || undefined}
            downloadUrl={`/api/delivery/${params.id}/download`}
            stripeConnectOnboardingUrl={deployedApp?.stripeConnectOnboardingUrl || undefined}
            hostingStatus={deployedApp?.hostingStatus}
          />
        )}

        {/* Onboarding Checklist for completed projects */}
        {isCompleted && (
          <OnboardingChecklist
            projectId={params.id}
            liveSiteUrl={deployedApp?.vercelProductionUrl || project.vercelDeploymentUrl || undefined}
            hasStripeConnect={!!deployedApp?.stripeConnectOnboarded}
            hasCustomDomain={!!deployedApp?.customDomain}
            hasChangeRequest={changeRequestCount > 0}
          />
        )}

        {/* Deployed App Management Panel */}
        {deployedApp && deployedApp.hostingStatus !== 'PROVISIONING' && (
          <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4">App Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Live URL */}
              {deployedApp.vercelProductionUrl && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-green-400 font-medium mb-1">Live URL</p>
                  <a
                    href={deployedApp.vercelProductionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-300 font-medium hover:underline break-all"
                  >
                    {deployedApp.vercelProductionUrl}
                  </a>
                </div>
              )}

              {/* Custom Domain */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 font-medium mb-1">Custom Domain</p>
                {deployedApp.customDomain ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{deployedApp.customDomain}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${deployedApp.domainVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {deployedApp.domainVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not configured</p>
                )}
              </div>

              {/* Stripe Connect */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 font-medium mb-1">Payments (Stripe Connect)</p>
                {deployedApp.stripeConnectOnboarded ? (
                  <span className="text-sm text-green-400 font-medium">Connected</span>
                ) : deployedApp.stripeConnectAccountId ? (
                  <span className="text-sm text-yellow-400 font-medium">Setup Incomplete</span>
                ) : (
                  <span className="text-sm text-gray-500">Not configured</span>
                )}
              </div>

              {/* GitHub Repo */}
              {deployedApp.githubRepoUrl && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 font-medium mb-1">GitHub Repository</p>
                  <a
                    href={deployedApp.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 font-medium hover:underline"
                  >
                    {deployedApp.githubRepoFullName || 'View Repo'}
                  </a>
                </div>
              )}

              {/* Hosting Subscription */}
              {deployedApp.subscription && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 font-medium mb-1">Hosting Plan</p>
                  <p className="text-sm text-white font-medium">
                    {deployedApp.subscription.plan === 'GROWTH' ? '$149/mo' :
                     deployedApp.subscription.plan === 'SCALE' ? '$349/mo' : '$49/mo'}
                    {' '}&mdash;{' '}
                    {deployedApp.subscription.plan === 'GROWTH' ? 'Growth' :
                     deployedApp.subscription.plan === 'SCALE' ? 'Scale' : 'Starter'}
                    {' '}({deployedApp.subscription.status})
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                >
                  Visit Live App
                </a>
              )}
              {deployedApp.subscription && (
                <BillingButton projectId={params.id} />
              )}
              {deployedApp.hostingStatus === 'ACTIVE' && (
                <>
                  <TransferButton projectId={params.id} />
                  <EjectButton projectId={params.id} />
                </>
              )}
            </div>

            {/* Upgrade Plan Section */}
            {deployedApp.subscription && (
              <div className="mt-4">
                <UpgradeSection
                  projectId={params.id}
                  currentPlan={deployedApp.subscription.plan}
                />
              </div>
            )}

            {/* Transfer Status Panel */}
            {deployedApp.hostingStatus === 'TRANSFERRED' && deployedApp.transfers?.[0] && (
              <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <h3 className="text-sm font-bold text-purple-400 mb-3">Transfer Status</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Transferred to {deployedApp.transfers[0].customerEmail} on{' '}
                  {new Date(deployedApp.transfers[0].createdAt).toLocaleDateString()}
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'GitHub Repository', done: deployedApp.transfers[0].githubTransferred, url: deployedApp.transfers[0].githubTransferUrl },
                    { label: 'Database (Neon)', done: deployedApp.transfers[0].neonTransferred, url: deployedApp.transfers[0].neonClaimUrl },
                    { label: 'Hosting (Vercel)', done: deployedApp.transfers[0].vercelTransferred, url: deployedApp.transfers[0].vercelReimportUrl },
                    { label: 'Payments (Stripe)', done: deployedApp.transfers[0].stripeDisconnected },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${item.done ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                      <span className="text-gray-300">{item.label}</span>
                      <span className={`text-xs ${item.done ? 'text-green-400' : 'text-yellow-400'}`}>
                        {item.done ? 'Complete' : 'Pending'}
                      </span>
                      {item.url && !item.done && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline ml-auto">
                          Claim Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Provisioning Progress (when still provisioning) */}
        {deployedApp && deployedApp.hostingStatus === 'PROVISIONING' && deployedApp.provisioningLog && (
          <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Deploying Your App...</h2>
            <div className="space-y-2">
              {(deployedApp.provisioningLog as Array<{ step: string; status: string; timestamp: string }>).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.status === 'completed' ? 'bg-green-500' :
                    entry.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                    entry.status === 'failed' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-gray-300 capitalize">{entry.step.replace(/_/g, ' ')}</span>
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

        {/* Change Request Panel (for completed projects with active hosting) */}
        {isCompleted && deployedApp && deployedApp.hostingStatus === 'ACTIVE' && (
          <div className="mb-8">
            <ChangeRequestPanel projectId={params.id} />
          </div>
        )}

        {/* Client Component for Real-Time Updates */}
        <ProjectDetailClient projectId={params.id} initialExecutions={executions} isInProgress={isInProgress} />
      </main>
    </div>
  );
}

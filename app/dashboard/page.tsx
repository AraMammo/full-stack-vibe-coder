/**
 * Dashboard Page - ShipKit
 *
 * Single "Your ShipKits" view with project cards.
 * Shows real-time progress and interactive previews.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

const TIER_DISPLAY: Record<string, { name: string; color: string }> = {
  VALIDATION_PACK: { name: 'Lite', color: 'bg-gray-500' },
  LAUNCH_BLUEPRINT: { name: 'Pro', color: 'bg-purple-500' },
  TURNKEY_SYSTEM: { name: 'Complete', color: 'bg-gradient-to-r from-pink-500 to-cyan-500' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10' },
  IN_PROGRESS: { label: 'Building...', color: 'text-cyan-400 bg-cyan-400/10' },
  PACKAGING: { label: 'Packaging...', color: 'text-purple-400 bg-purple-400/10' },
  COMPLETED: { label: 'Ready', color: 'text-green-400 bg-green-400/10' },
  FAILED: { label: 'Failed', color: 'text-red-400 bg-red-400/10' },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      projectName: true,
      biabTier: true,
      status: true,
      progress: true,
      completedPrompts: true,
      totalPrompts: true,
      createdAt: true,
      completedAt: true,
      githubRepoUrl: true,
      vercelDeploymentUrl: true,
    },
  });

  return (
    <main id="main-content" className="min-h-screen pt-20 pb-16 bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Your ShipKits</h1>
              <p className="mt-1 text-sm text-gray-400">
                Welcome back, {session.user.name || session.user.email?.split('@')[0]}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <span>+</span> New ShipKit
            </Link>
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {projects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">&#128640;</div>
            <h3 className="text-lg font-medium text-white mb-2">No ShipKits yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Describe your business idea on the homepage and we'll build everything for you.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Create Your First ShipKit
              <span>&#8594;</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const tier = TIER_DISPLAY[project.biabTier] || TIER_DISPLAY.VALIDATION_PACK;
              const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.PENDING;
              const isInProgress = project.status === 'IN_PROGRESS' || project.status === 'PENDING' || project.status === 'PACKAGING';
              const isCompleted = project.status === 'COMPLETED';

              return (
                <div
                  key={project.id}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold text-white ${tier.color}`}>
                          {tier.name}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white truncate">{project.projectName}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                        {project.completedAt && (
                          <span> &middot; Completed {new Date(project.completedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isCompleted && project.vercelDeploymentUrl && (
                        <a
                          href={project.vercelDeploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                        >
                          View Live Site
                        </a>
                      )}
                      {isCompleted && project.githubRepoUrl && (
                        <a
                          href={project.githubRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                        >
                          GitHub
                        </a>
                      )}
                      <Link
                        href={`/dashboard/project/${project.id}`}
                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                      >
                        {isCompleted ? 'Download' : 'View Details'}
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isInProgress && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>{project.completedPrompts}/{project.totalPrompts} sections complete</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

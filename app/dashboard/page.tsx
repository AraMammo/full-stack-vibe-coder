/**
 * Dashboard Page - Redesigned
 *
 * Clean, tab-based dashboard with dark theme.
 * Part of UX overhaul for better organization.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

// Tab types
type TabType = 'projects' | 'videos' | 'tools';

interface DashboardProps {
  searchParams: { tab?: string };
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Determine active tab
  const activeTab: TabType = (['projects', 'videos', 'tools'].includes(searchParams.tab || '')
    ? searchParams.tab
    : 'projects') as TabType;

  // Fetch user's BIAB projects
  const biabProjects = await prisma.project.findMany({
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
      v0PreviewUrl: true,
      v0DeployUrl: true,
    },
  });

  // Fetch user's faceless video jobs
  const videoJobs = await prisma.facelessVideoJob.findMany({
    where: { userId: session.user.id },
    include: {
      scenes: {
        select: { id: true, sceneIndex: true },
        orderBy: { sceneIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Calculate counts for tabs
  const counts = {
    projects: biabProjects.length,
    videos: videoJobs.length,
    tools: 0, // Purchased tools count would go here
  };

  return (
    <main id="main-content" className="min-h-screen pt-20 pb-16 bg-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-400">
                Welcome back, {session.user.name || session.user.email?.split('@')[0]}
              </p>
            </div>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <span>+</span> New Project
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1" aria-label="Dashboard tabs">
            <TabButton
              href="/dashboard?tab=projects"
              isActive={activeTab === 'projects'}
              label="BIAB Projects"
              count={counts.projects}
            />
            <TabButton
              href="/dashboard?tab=videos"
              isActive={activeTab === 'videos'}
              label="Video Jobs"
              count={counts.videos}
            />
            <TabButton
              href="/dashboard?tab=tools"
              isActive={activeTab === 'tools'}
              label="My Tools"
              count={counts.tools}
            />
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'projects' && (
          <ProjectsTab projects={biabProjects} />
        )}
        {activeTab === 'videos' && (
          <VideosTab jobs={videoJobs} />
        )}
        {activeTab === 'tools' && (
          <ToolsTab />
        )}
      </div>
    </main>
  );
}

// Tab Button Component
function TabButton({
  href,
  isActive,
  label,
  count,
}: {
  href: string;
  isActive: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`
        relative px-4 py-3 text-sm font-medium transition-colors
        ${isActive
          ? 'text-white'
          : 'text-gray-400 hover:text-white'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex items-center gap-2">
        {label}
        {count > 0 && (
          <span className={`
            px-2 py-0.5 rounded-full text-xs
            ${isActive ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-gray-400'}
          `}>
            {count}
          </span>
        )}
      </span>
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-cyan-500" />
      )}
    </Link>
  );
}

// Projects Tab Content
function ProjectsTab({ projects }: { projects: any[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon="&#128188;"
        title="No projects yet"
        description="Create your first Business in a Box project to get started."
        actionLabel="Start a Project"
        actionHref="/get-started"
      />
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: any }) {
  const tierNames: Record<string, string> = {
    VALIDATION_PACK: 'Starter',
    LAUNCH_BLUEPRINT: 'Complete',
    TURNKEY_SYSTEM: 'Turnkey',
  };

  const tierColors: Record<string, string> = {
    VALIDATION_PACK: 'bg-gray-500',
    LAUNCH_BLUEPRINT: 'bg-purple-500',
    TURNKEY_SYSTEM: 'bg-gradient-to-r from-pink-500 to-cyan-500',
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10' },
    IN_PROGRESS: { label: 'Processing', color: 'text-cyan-400 bg-cyan-400/10' },
    COMPLETED: { label: 'Completed', color: 'text-green-400 bg-green-400/10' },
    FAILED: { label: 'Failed', color: 'text-red-400 bg-red-400/10' },
  };

  const status = statusConfig[project.status] || statusConfig.PENDING;
  const isInProgress = project.status === 'IN_PROGRESS' || project.status === 'PENDING';
  const isCompleted = project.status === 'COMPLETED';

  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-1 rounded text-xs font-bold text-white ${tierColors[project.biabTier]}`}>
              {tierNames[project.biabTier]}
            </span>
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white truncate">{project.projectName}</h3>
          <p className="text-sm text-gray-400 mt-1">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {isCompleted && project.v0DeployUrl && (
            <a
              href={project.v0DeployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
            >
              View Live Site
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
}

// Videos Tab Content
function VideosTab({ jobs }: { jobs: any[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="&#127909;"
        title="No video jobs yet"
        description="Create faceless videos for your social media content."
        actionLabel="Create Video"
        actionHref="/tools/faceless-video-generator"
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <VideoCard key={job.id} job={job} />
      ))}
    </div>
  );
}

// Video Card Component
function VideoCard({ job }: { job: any }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    QUEUED: { label: 'Queued', color: 'text-gray-400 bg-gray-400/10' },
    UPLOADING: { label: 'Uploading', color: 'text-blue-400 bg-blue-400/10' },
    PROCESSING: { label: 'Processing', color: 'text-yellow-400 bg-yellow-400/10' },
    COMPLETED: { label: 'Completed', color: 'text-green-400 bg-green-400/10' },
    FAILED: { label: 'Failed', color: 'text-red-400 bg-red-400/10' },
  };

  const status = statusConfig[job.status] || statusConfig.QUEUED;
  const isProcessing = job.status === 'PROCESSING' || job.status === 'UPLOADING';
  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className="text-xs text-gray-500">
              {job.scenes?.length || 0} scene{job.scenes?.length !== 1 ? 's' : ''}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">
            Faceless Video
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Created {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {isCompleted && job.outputVideoUrl && (
            <a
              href={job.outputVideoUrl}
              download={`faceless-video-${job.id}.mp4`}
              className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
            >
              Download
            </a>
          )}
          {isFailed && (
            <Link
              href="/tools/faceless-video-generator"
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Try Again
            </Link>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{job.status === 'UPLOADING' ? 'Uploading...' : 'Processing...'}</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {isFailed && job.errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {job.errorMessage}
        </div>
      )}

      {/* Video Preview */}
      {isCompleted && job.outputVideoUrl && (
        <div className="mt-4">
          <video
            controls
            className="w-full max-w-lg rounded-lg border border-white/10"
            src={job.outputVideoUrl}
            style={{ maxHeight: '240px' }}
          />
        </div>
      )}
    </div>
  );
}

// Tools Tab Content
function ToolsTab() {
  // This would show purchased tools - for now show empty state with links
  return (
    <EmptyState
      icon="&#128736;"
      title="No purchased tools"
      description="Get access to premium automation tools."
      actionLabel="Browse Tools"
      actionHref="/tools"
    />
  );
}

// Empty State Component
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        {actionLabel}
        <span>&#8594;</span>
      </Link>
    </div>
  );
}

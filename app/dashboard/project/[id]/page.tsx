import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ChangeRequestPanel } from "./ChangeRequestPanel";
import { BuildStatusPanel } from "./BuildStatusPanel";
import { EjectButton } from "./EjectButton";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      deployedApp: {
        select: {
          hostingStatus: true,
          vercelProductionUrl: true,
          githubRepoUrl: true,
          stripeConnectOnboardingUrl: true,
          stripeConnectOnboarded: true,
          customDomain: true,
          domainVerified: true,
        },
      },
      changeRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!project) notFound();
  if (project.userId !== session.user.id) notFound();

  const isLive = project.status === "LIVE";
  const isBuilding =
    project.status === "PROVISIONING" || project.status === "CUSTOMIZING";
  const isFailed = project.status === "FAILED";
  const liveUrl =
    project.productionUrl || project.deployedApp?.vercelProductionUrl;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/dashboard"
          className="text-fsvc-text-secondary hover:text-white transition-colors"
        >
          &larr; Projects
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={project.status} />
          </div>
        </div>

        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-base text-sm font-medium transition-colors"
          >
            View Live Site
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Build progress (for in-progress builds) */}
          {isBuilding && <BuildStatusPanel projectId={project.id} />}

          {/* Error state */}
          {isFailed && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
              <h2 className="text-lg font-bold text-red-400 mb-2">
                Build Failed
              </h2>
              <p className="text-sm text-fsvc-text-secondary mb-4">
                {project.errorMessage || "An unexpected error occurred during the build."}
              </p>
              <form action={`/api/projects/${project.id}/build`} method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Retry Build
                </button>
              </form>
            </div>
          )}

          {/* Live site preview */}
          {isLive && liveUrl && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-medium text-fsvc-text-secondary">
                  Live Preview
                </span>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-2 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
              <div className="aspect-video bg-base">
                <iframe
                  src={liveUrl}
                  className="w-full h-full border-0"
                  title={`${project.name} preview`}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}

          {/* Change requests (only for live projects) */}
          {isLive && <ChangeRequestPanel projectId={project.id} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          {isLive && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-fsvc-text-secondary mb-4">
                Quick Links
              </h3>
              <div className="space-y-3">
                {liveUrl && (
                  <QuickLink
                    label="Live Site"
                    href={liveUrl}
                    external
                  />
                )}
                {project.deployedApp?.githubRepoUrl && (
                  <QuickLink
                    label="GitHub Repository"
                    href={project.deployedApp.githubRepoUrl}
                    external
                  />
                )}
                {project.deployedApp?.stripeConnectOnboardingUrl &&
                  !project.deployedApp.stripeConnectOnboarded && (
                    <QuickLink
                      label="Complete Stripe Setup"
                      href={project.deployedApp.stripeConnectOnboardingUrl}
                      external
                      highlight
                    />
                  )}
              </div>
            </div>
          )}

          {/* Domain */}
          {isLive && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-fsvc-text-secondary mb-3">
                Custom Domain
              </h3>
              {project.deployedApp?.customDomain ? (
                <div>
                  <p className="text-sm text-white">
                    {project.deployedApp.customDomain}
                  </p>
                  <p className="text-xs text-fsvc-text-secondary mt-1">
                    {project.deployedApp.domainVerified
                      ? "Verified"
                      : "Pending verification"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-fsvc-text-secondary">
                  No custom domain configured.{" "}
                  <Link
                    href={`/dashboard/project/${project.id}/domain`}
                    className="text-accent-2 hover:underline"
                  >
                    Add one
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Hosting */}
          {isLive && project.deployedApp && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-fsvc-text-secondary mb-3">
                Hosting
              </h3>
              <p className="text-sm text-white mb-1">
                Status:{" "}
                <span className="text-green-400">
                  {project.deployedApp.hostingStatus}
                </span>
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href={`/api/billing/portal?projectId=${project.id}`}
                  className="block text-sm text-accent-2 hover:underline"
                >
                  Manage Billing
                </Link>
                <EjectButton projectId={project.id} />
              </div>
            </div>
          )}

          {/* Project Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-fsvc-text-secondary mb-3">
              Project Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-fsvc-text-disabled">Created</dt>
                <dd className="text-fsvc-text-secondary">
                  {new Date(project.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {project.completedAt && (
                <div>
                  <dt className="text-fsvc-text-disabled">Completed</dt>
                  <dd className="text-fsvc-text-secondary">
                    {new Date(project.completedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-fsvc-text-disabled">Project ID</dt>
                <dd className="text-fsvc-text-disabled font-mono text-xs break-all">
                  {project.id}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    INTAKE: "bg-blue-500/20 text-blue-400",
    CUSTOMIZING: "bg-purple-500/20 text-purple-400",
    PREVIEWING: "bg-amber-500/20 text-amber-400",
    PROVISIONING: "bg-accent-2/20 text-accent-2",
    LIVE: "bg-green-500/20 text-green-400",
    FAILED: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.INTAKE}`}
    >
      {status}
    </span>
  );
}

function QuickLink({
  label,
  href,
  external,
  highlight,
}: {
  label: string;
  href: string;
  external?: boolean;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`block text-sm ${
        highlight ? "text-amber-400 font-medium" : "text-accent-2"
      } hover:underline`}
    >
      {label} {external && "↗"}
    </a>
  );
}

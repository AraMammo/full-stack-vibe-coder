import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  INTAKE: "bg-blue-500/20 text-blue-400",
  CUSTOMIZING: "bg-purple-500/20 text-purple-400",
  PREVIEWING: "bg-amber-500/20 text-amber-400",
  PROVISIONING: "bg-accent-2/20 text-accent-2",
  LIVE: "bg-green-500/20 text-green-400",
  FAILED: "bg-red-500/20 text-red-400",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true } },
      deployedApp: {
        select: {
          hostingStatus: true,
          vercelProductionUrl: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Projects</h1>
          <p className="text-fsvc-text-secondary text-sm mt-1">
            Manage your websites and track build progress
          </p>
        </div>
        <Link
          href="/get-started"
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-base text-sm font-medium transition-colors"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No projects yet
          </h2>
          <p className="text-fsvc-text-secondary mb-6 max-w-md mx-auto">
            Tell us about your business and we&apos;ll build you a professional
            website in minutes.
          </p>
          <Link
            href="/get-started"
            className="inline-block px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-base font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const badge = statusColors[project.status] || statusColors.INTAKE;
            const url =
              project.productionUrl ||
              project.deployedApp?.vercelProductionUrl;

            return (
              <Link
                key={project.id}
                href={`/dashboard/project/${project.id}`}
                className="block rounded-xl border border-border bg-surface p-6 hover:border-border hover:bg-surface transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold text-white truncate">
                        {project.name}
                      </h2>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${badge}`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-fsvc-text-secondary">
                      {project.template && (
                        <span>{project.template.name}</span>
                      )}
                      <span>
                        Created{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {url && (
                    <span className="text-xs text-accent-2 truncate max-w-[200px]">
                      {url.replace(/^https?:\/\//, "")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface ProjectStatus {
  project: {
    status: string;
    productionUrl: string | null;
    errorMessage: string | null;
  };
  deployedApp: {
    hostingStatus: string;
    productionUrl: string | null;
    provisioningLog: Array<{
      step: string;
      status: string;
      timestamp: string;
      error?: string;
    }> | null;
  } | null;
}

const STEP_LABELS: Record<string, string> = {
  load_project: "Loading project",
  match_template: "Matching template",
  build_template: "Building from template",
  neon_create: "Creating database",
  database_migrate: "Running migrations",
  stripe_connect: "Setting up payments",
  github_push: "Pushing to GitHub",
  vercel_create: "Creating Vercel project",
  vercel_deploy: "Deploying",
  verify_live: "Verifying site",
  save_record: "Saving records",
  hosting_subscription: "Setting up hosting",
  seed_database: "Seeding database",
};

export function BuildStatusPanel({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<ProjectStatus | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);

          // Stop polling when build completes or fails
          if (
            data.project.status === "LIVE" ||
            data.project.status === "FAILED"
          ) {
            clearInterval(interval);
            // Reload the page to show final state
            window.location.reload();
          }
        }
      } catch {
        // Continue polling
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const log = status?.deployedApp?.provisioningLog;
  const steps = Array.isArray(log) ? log : [];

  return (
    <div className="rounded-xl border border-accent-2/30 bg-accent-2/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-accent-2 animate-pulse" />
        <h2 className="text-lg font-bold text-white">Building your site...</h2>
      </div>

      <p className="text-sm text-fsvc-text-secondary mb-6">
        This usually takes 2-3 minutes. You can leave this page and come back.
      </p>

      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <StepIcon status={step.status} />
              <span
                className={`text-sm ${
                  step.status === "completed"
                    ? "text-green-400"
                    : step.status === "running"
                      ? "text-accent-2"
                      : step.status === "failed"
                        ? "text-red-400"
                        : "text-fsvc-text-disabled"
                }`}
              >
                {STEP_LABELS[step.step] || step.step}
              </span>
              {step.error && (
                <span className="text-xs text-red-400">({step.error})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {steps.length === 0 && (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent-2 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-fsvc-text-secondary">
            Preparing your build...
          </span>
        </div>
      )}
    </div>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
        <span className="text-white text-xs">✓</span>
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="w-5 h-5 border-2 border-accent-2 border-t-transparent rounded-full animate-spin" />
    );
  }
  if (status === "failed") {
    return (
      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
        <span className="text-white text-xs">✗</span>
      </div>
    );
  }
  return <div className="w-5 h-5 rounded-full bg-fsvc-text-disabled" />;
}

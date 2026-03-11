'use client';

import { useState, useEffect, useRef } from 'react';

interface ProgressData {
  completedCount: number;
  totalCount: number;
  progress: number;
  currentSection: string | null;
  status: string;
  codegenStatus: string | null;
  completedSections: {
    id: number;
    name: string;
    section: string;
    completedAt: Date | null;
  }[];
}

const STEP_LABELS: Record<string, string> = {
  'Business Brief': 'Analyzing your business...',
  'Brand Identity': 'Designing your brand identity...',
  'Content Strategy': 'Planning your content strategy...',
  'UX Strategy': 'Mapping user experience...',
  'Marketing Strategy': 'Building marketing playbook...',
  'Launch Playbook': 'Creating launch plan...',
  'App Architecture': 'Designing database & API...',
  'Next.js Codebase': 'Generating your full-stack app...',
};

const PROVISIONING_LABELS: Record<string, string> = {
  supabase_create: 'Creating your database...',
  database_migrate: 'Running database migrations...',
  stripe_connect: 'Connecting Stripe payments...',
  github_push: 'Pushing code to GitHub...',
  vercel_create: 'Setting up Vercel hosting...',
  vercel_deploy: 'Deploying your app...',
  verify_live: 'Verifying site is live...',
  save_record: 'Saving deployment info...',
  hosting_subscription: 'Setting up hosting plan...',
};

export default function BuildProgressView({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/project/${projectId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        setProgress(JSON.parse(event.data));
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [projectId]);

  const completedCount = progress?.completedCount || 0;
  const totalCount = progress?.totalCount || 8;
  const percentage = progress?.progress || 0;

  // Determine current step label
  let currentLabel = 'Starting build...';
  if (progress?.codegenStatus?.startsWith('provisioning:')) {
    const step = progress.codegenStatus.split(':')[1];
    currentLabel = PROVISIONING_LABELS[step] || `Deploying: ${step}...`;
  } else if (progress?.currentSection) {
    currentLabel = STEP_LABELS[progress.currentSection] || `Working on ${progress.currentSection}...`;
  }

  const isProvisioning = progress?.codegenStatus?.startsWith('provisioning:');

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Building {projectName}
          </h1>
          <p className="text-fsvc-text-secondary text-sm">
            Sit tight — your full-stack app is being generated and deployed.
          </p>
        </div>

        {/* Progress Ring / Bar */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="#FF5C35" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-2xl font-bold text-white">{percentage}%</span>
          </div>
        </div>

        {/* Current Step */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent-2 animate-pulse" />
          <p className="text-accent-2 font-medium text-sm animate-pulse">
            {currentLabel}
          </p>
        </div>

        {/* Completed Steps Timeline */}
        <div className="space-y-2">
          {progress?.completedSections.map((section) => (
            <div key={section.id} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs text-white font-bold">
                &#10003;
              </span>
              <span className="text-sm text-green-300">{section.name}</span>
            </div>
          ))}

          {/* Current step */}
          {progress?.currentSection && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent-2/5 border border-accent-2/20">
              <div className="w-5 h-5 rounded-full border-2 border-accent-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent-2 animate-pulse" />
              </div>
              <span className="text-sm text-accent-2">{progress.currentSection}</span>
            </div>
          )}

          {/* Provisioning steps */}
          {isProvisioning && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent/5 border border-accent/20">
              <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <span className="text-sm text-accent">Deploying infrastructure</span>
            </div>
          )}
        </div>

        {/* What you'll get sidebar */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-fsvc-text-secondary uppercase tracking-wide font-semibold mb-3">
            What you&apos;ll get
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-fsvc-text-secondary">
            <span>&#10003; Live website</span>
            <span>&#10003; PostgreSQL database</span>
            <span>&#10003; User auth</span>
            <span>&#10003; Stripe payments</span>
            <span>&#10003; Email on your domain</span>
            <span>&#10003; GitHub repo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Environment variable validation
 * Checks required vars exist before pipeline starts, preventing mid-pipeline failures.
 */

const ALWAYS_REQUIRED = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'ANTHROPIC_API_KEY',
] as const;

const PIPELINE_REQUIRED = [
  'GITHUB_TOKEN',
  'GITHUB_ORG_NAME',
  'VERCEL_TOKEN',
  'VERCEL_TEAM_ID',
  'NEON_API_KEY',
  'STRIPE_HOSTING_PRICE_ID',
] as const;

const PRESENCE_REQUIRED = [
  'GITHUB_TOKEN',
  'GITHUB_ORG_NAME',
  'VERCEL_TOKEN',
  'VERCEL_TEAM_ID',
  'STRIPE_PRESENCE_PRICE_ID',
] as const;

type Scope = 'always' | 'pipeline' | 'presence';

const SCOPE_VARS: Record<Scope, readonly string[]> = {
  always: ALWAYS_REQUIRED,
  pipeline: [...ALWAYS_REQUIRED, ...PIPELINE_REQUIRED],
  presence: [...ALWAYS_REQUIRED, ...PRESENCE_REQUIRED],
};

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateEnv(scope: Scope): EnvValidationResult {
  const required = SCOPE_VARS[scope];
  const missing = required.filter((key) => !process.env[key]);
  return { valid: missing.length === 0, missing };
}

export function assertPipelineEnv(): void {
  const result = validateEnv('pipeline');
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables for pipeline: ${result.missing.join(', ')}`
    );
  }
}

export function assertPresenceEnv(): void {
  const result = validateEnv('presence');
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables for presence deploy: ${result.missing.join(', ')}`
    );
  }
}

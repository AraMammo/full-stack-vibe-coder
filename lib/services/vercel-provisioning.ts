/**
 * Vercel Provisioning Service
 *
 * Creates and manages Vercel projects for customer apps.
 * Wraps the Vercel REST API.
 *
 * Auth: Bearer token via VERCEL_TOKEN (must be team-scoped)
 * Team: VERCEL_TEAM_ID
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelEnvVar {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type: 'encrypted' | 'plain';
}

export interface VercelProjectResult {
  projectId: string;
  projectName: string;
}

export interface VercelDeploymentResult {
  deploymentId: string;
  url: string;
  readyState: string;
}

function getToken(): string {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN not set');
  return token;
}

function getTeamId(): string {
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!teamId) throw new Error('VERCEL_TEAM_ID not set');
  return teamId;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

function teamQuery(): string {
  return `teamId=${getTeamId()}`;
}

/**
 * Create a Vercel project linked to a GitHub repo
 */
export async function createProject(
  name: string,
  githubRepo: string
): Promise<VercelProjectResult> {
  const [owner, repo] = githubRepo.split('/');

  const response = await fetch(`${VERCEL_API_BASE}/v10/projects?${teamQuery()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name,
      framework: 'nextjs',
      gitRepository: {
        type: 'github',
        repo: githubRepo,
      },
      buildCommand: 'npm run build',
      installCommand: 'npm install',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Vercel project: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(`[Vercel] Project created: ${data.id} (${data.name})`);

  return {
    projectId: data.id,
    projectName: data.name,
  };
}

/**
 * Set environment variables on a Vercel project
 */
export async function setEnvVars(
  projectId: string,
  vars: VercelEnvVar[]
): Promise<void> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}/env?${teamQuery()}`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(vars),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to set env vars: ${response.status} ${error}`);
  }

  console.log(`[Vercel] Set ${vars.length} env vars on project ${projectId}`);
}

/**
 * Trigger a new deployment
 */
export async function triggerDeploy(
  projectName: string,
  githubRepo: string
): Promise<VercelDeploymentResult> {
  const [owner, repo] = githubRepo.split('/');

  const response = await fetch(`${VERCEL_API_BASE}/v13/deployments?${teamQuery()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: projectName,
      gitSource: {
        type: 'github',
        org: owner,
        repo,
        ref: 'main',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to trigger deployment: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(`[Vercel] Deployment triggered: ${data.id}`);

  return {
    deploymentId: data.id,
    url: data.url,
    readyState: data.readyState,
  };
}

/**
 * Wait for a deployment to reach READY state
 */
export async function waitForDeployment(
  deploymentId: string,
  maxWaitMs: number = 300000,
  pollIntervalMs: number = 10000
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `${VERCEL_API_BASE}/v13/deployments/${deploymentId}?${teamQuery()}`,
      { headers: headers() }
    );

    if (!response.ok) {
      throw new Error(`Failed to check deployment status: ${response.status}`);
    }

    const data = await response.json();

    if (data.readyState === 'READY') {
      const productionUrl = `https://${data.url}`;
      console.log(`[Vercel] Deployment ready: ${productionUrl}`);
      return productionUrl;
    }

    if (data.readyState === 'ERROR' || data.readyState === 'CANCELED') {
      throw new Error(`Deployment failed with state: ${data.readyState}`);
    }

    console.log(`[Vercel] Deployment ${deploymentId} state: ${data.readyState}, waiting...`);
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Deployment ${deploymentId} did not become ready within ${maxWaitMs / 1000}s`);
}

/**
 * Add a custom domain to a Vercel project
 */
export async function addCustomDomain(
  projectId: string,
  domain: string
): Promise<{ configured: boolean; verification: Array<{ type: string; domain: string; value: string }> }> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}/domains?${teamQuery()}`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name: domain }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add domain: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(`[Vercel] Domain added: ${domain}`);

  return {
    configured: data.verified || false,
    verification: data.verification || [],
  };
}

/**
 * Check domain configuration status
 */
export async function checkDomainStatus(
  projectId: string,
  domain: string
): Promise<{ verified: boolean; dnsRecords: Array<{ type: string; name: string; value: string }> }> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}?${teamQuery()}`,
    { headers: headers() }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to check domain: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    verified: data.verified || false,
    dnsRecords: data.verification || [],
  };
}

/**
 * Delete a Vercel project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}?${teamQuery()}`,
    {
      method: 'DELETE',
      headers: headers(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete project: ${response.status} ${error}`);
  }

  console.log(`[Vercel] Project deleted: ${projectId}`);
}

/**
 * Get the production URL for a project
 */
export async function getProductionUrl(projectId: string): Promise<string | null> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}?${teamQuery()}`,
    { headers: headers() }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const alias = data.targets?.production?.alias?.[0];
  return alias ? `https://${alias}` : null;
}

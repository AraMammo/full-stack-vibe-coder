/**
 * Neon Provisioning Service
 *
 * Creates and manages Neon PostgreSQL projects for customer apps.
 * Replaces supabase-provisioning.ts for new deployments.
 *
 * Uses @neondatabase/api-client for management operations and
 * @neondatabase/serverless for SQL execution.
 */

import { createApiClient } from '@neondatabase/api-client';
import { Pool } from '@neondatabase/serverless';

export interface ProvisionedNeon {
  projectId: string;
  branchId: string;
  databaseUrl: string;
  pooledUrl: string;
}

function getClient() {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) throw new Error('NEON_API_KEY not set');
  return createApiClient({ apiKey });
}

/**
 * Create a new Neon project with autoscaling configuration
 */
export async function createProject(
  name: string,
  region: string = 'aws-us-east-1'
): Promise<{
  projectId: string;
  branchId: string;
  host: string;
  dbName: string;
  roleName: string;
  rolePassword: string;
}> {
  const client = getClient();

  const { data } = await client.createProject({
    project: {
      name,
      region_id: region,
      pg_version: 16,
      default_endpoint_settings: {
        autoscaling_limit_min_cu: 0.25,
        autoscaling_limit_max_cu: 1,
        suspend_timeout_seconds: 300, // 5 minutes
      },
    },
  });

  const project = data.project;
  const branch = data.branch;
  const endpoints = data.endpoints;
  const roles = data.roles;
  const databases = data.databases;

  const role = roles?.[0];
  const db = databases?.[0];
  const endpoint = endpoints?.[0];

  if (!role || !db || !endpoint) {
    throw new Error('Neon project creation missing expected defaults');
  }

  console.log(`[Neon] Project created: ${project.id} (${project.name})`);

  return {
    projectId: project.id,
    branchId: branch.id,
    host: endpoint.host,
    dbName: db.name,
    roleName: role.name,
    rolePassword: role.password || '',
  };
}

/**
 * Wait for project endpoints to be ready (~5s typical)
 */
export async function waitForReady(
  projectId: string,
  maxWaitMs: number = 30000,
  pollIntervalMs: number = 2000
): Promise<void> {
  const client = getClient();
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const { data } = await client.listProjectEndpoints(projectId);
    const endpoints = data.endpoints;

    const allReady = endpoints.every(
      (ep: { current_state: string }) => ep.current_state === 'idle' || ep.current_state === 'active'
    );

    if (allReady && endpoints.length > 0) {
      console.log(`[Neon] Project ${projectId} is ready`);
      return;
    }

    console.log(`[Neon] Project ${projectId} not ready yet, waiting...`);
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Neon project ${projectId} did not become ready within ${maxWaitMs / 1000}s`);
}

/**
 * Get connection string for a project
 */
export async function getConnectionString(
  projectId: string,
  pooled: boolean = true
): Promise<string> {
  const client = getClient();

  // Get the default branch's database and role info
  const { data: branchData } = await client.listProjectBranches({ projectId });
  const defaultBranch = branchData.branches.find((b: { default: boolean }) => b.default);
  if (!defaultBranch) throw new Error('No default branch found');

  const { data: dbData } = await client.listProjectBranchDatabases(projectId, defaultBranch.id);
  const db = dbData.databases[0];
  if (!db) throw new Error('No database found');

  const { data: roleData } = await client.listProjectBranchRoles(projectId, defaultBranch.id);
  const role = roleData.roles[0];
  if (!role) throw new Error('No role found');

  const { data } = await client.getConnectionUri({
    projectId,
    branch_id: defaultBranch.id,
    database_name: db.name,
    role_name: role.name,
    pooled,
  });

  return data.uri;
}

/**
 * Run a SQL migration using the Neon serverless driver
 */
export async function runMigration(connectionString: string, sql: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(sql);
    console.log(`[Neon] Migration executed successfully`);
  } finally {
    await pool.end();
  }
}

/**
 * Full provisioning flow: create → wait → get URLs
 */
export async function provisionProject(
  name: string,
  region?: string
): Promise<ProvisionedNeon> {
  const actualRegion = region || 'aws-us-east-1';
  const result = await createProject(name, actualRegion);

  await waitForReady(result.projectId);

  // Build connection strings from the creation result
  const baseUrl = `postgresql://${result.roleName}:${encodeURIComponent(result.rolePassword)}@${result.host}/${result.dbName}`;
  const databaseUrl = `${baseUrl}?sslmode=require`;

  // Pooled URL uses the -pooler suffix on the host
  const poolerHost = result.host.replace('.', '-pooler.');
  const pooledUrl = `postgresql://${result.roleName}:${encodeURIComponent(result.rolePassword)}@${poolerHost}/${result.dbName}?sslmode=require`;

  return {
    projectId: result.projectId,
    branchId: result.branchId,
    databaseUrl,
    pooledUrl,
  };
}

/**
 * Create a project transfer request — generates a claimable URL for the customer.
 * Neon sends the transfer notification; customer claims via their Neon console.
 */
export async function createTransferRequest(
  projectId: string,
  _email: string,
  ttlDays: number = 7
): Promise<string> {
  const client = getClient();

  await client.createProjectTransferRequest(projectId, {
    ttl_seconds: ttlDays * 24 * 60 * 60,
  });

  console.log(`[Neon] Transfer request created for project ${projectId}`);

  // The API creates a transfer request; customer needs a Neon account to accept
  return `https://console.neon.tech/app/projects?transfer=${projectId}`;
}

/**
 * Delete a Neon project (cleanup/eject)
 */
export async function deleteProject(projectId: string): Promise<void> {
  const client = getClient();
  await client.deleteProject(projectId);
  console.log(`[Neon] Project deleted: ${projectId}`);
}

/**
 * Export database schema for eject flow
 */
export async function exportDatabase(connectionString: string): Promise<string> {
  const pool = new Pool({ connectionString });

  try {
    // Get all table definitions from information_schema
    const { rows: tables } = await pool.query(
      `SELECT table_name, column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position`
    );

    if (tables.length === 0) {
      return '-- No tables found in public schema';
    }

    // Group by table
    const tableMap: Record<string, Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>> = {};
    for (const row of tables) {
      if (!tableMap[row.table_name]) {
        tableMap[row.table_name] = [];
      }
      tableMap[row.table_name].push(row);
    }

    // Generate CREATE TABLE statements
    const statements: string[] = ['-- Database export from Neon PostgreSQL', '-- Generated by Full Stack Vibe Coder', ''];

    for (const tableName of Object.keys(tableMap)) {
      const columns = tableMap[tableName];
      const colDefs = columns.map((col) => {
        let def = `  "${col.column_name}" ${col.data_type}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      });

      statements.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
      statements.push(colDefs.join(',\n'));
      statements.push(');');
      statements.push('');
    }

    return statements.join('\n');
  } finally {
    await pool.end();
  }
}

/**
 * Resend Provisioning Service
 *
 * Manages email domains for customer apps via Resend API.
 * Enables customers to send transactional emails from their domain.
 *
 * Auth: Bearer token via RESEND_API_KEY
 * Rate limit: 2 req/sec
 */

const RESEND_API_BASE = 'https://api.resend.com';

interface ResendDomain {
  id: string;
  name: string;
  status: string;
  records: ResendDnsRecord[];
}

export interface ResendDnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl: string;
  status: string;
}

export interface ProvisionedResendDomain {
  domainId: string;
  dnsRecords: ResendDnsRecord[];
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Register a domain with Resend for email sending
 */
export async function createDomain(domain: string): Promise<ProvisionedResendDomain> {
  const response = await fetch(`${RESEND_API_BASE}/domains`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name: domain }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Resend domain: ${response.status} ${error}`);
  }

  const data: ResendDomain = await response.json();
  console.log(`[Resend] Domain registered: ${domain} (${data.id})`);

  return {
    domainId: data.id,
    dnsRecords: data.records || [],
  };
}

/**
 * Get DNS records that need to be configured for a domain
 */
export async function getDnsRecords(domainId: string): Promise<ResendDnsRecord[]> {
  const response = await fetch(`${RESEND_API_BASE}/domains/${domainId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get domain records: ${response.status} ${error}`);
  }

  const data: ResendDomain = await response.json();
  return data.records || [];
}

/**
 * Check if a domain has been verified
 */
export async function verifyDomain(domainId: string): Promise<{
  verified: boolean;
  status: string;
  records: ResendDnsRecord[];
}> {
  const response = await fetch(`${RESEND_API_BASE}/domains/${domainId}/verify`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to verify domain: ${response.status} ${error}`);
  }

  // After triggering verification, get updated status
  const statusResponse = await fetch(`${RESEND_API_BASE}/domains/${domainId}`, {
    headers: getHeaders(),
  });

  if (!statusResponse.ok) {
    throw new Error('Failed to get domain status after verification');
  }

  const data: ResendDomain = await statusResponse.json();

  return {
    verified: data.status === 'verified',
    status: data.status,
    records: data.records || [],
  };
}

/**
 * Delete a domain from Resend
 */
export async function deleteDomain(domainId: string): Promise<void> {
  const response = await fetch(`${RESEND_API_BASE}/domains/${domainId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete domain: ${response.status} ${error}`);
  }

  console.log(`[Resend] Domain deleted: ${domainId}`);
}

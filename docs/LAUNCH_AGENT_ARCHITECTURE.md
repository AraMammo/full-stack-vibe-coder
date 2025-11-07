# Launch Agent System - Complete Architecture

> **Status:** Planning Phase
> **Version:** 1.0
> **Last Updated:** 2025-11-07
> **Author:** FullStackVibeCoder Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Agent Architecture](#agent-architecture)
4. [Data Models](#data-models)
5. [API Integrations](#api-integrations)
6. [State Management](#state-management)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Security & Compliance](#security--compliance)
9. [User Experience Flow](#user-experience-flow)
10. [Cost Analysis](#cost-analysis)
11. [Technical Dependencies](#technical-dependencies)
12. [Implementation Phases](#implementation-phases)
13. [Testing Strategy](#testing-strategy)
14. [Deployment & Monitoring](#deployment--monitoring)
15. [Edge Cases & Failure Modes](#edge-cases--failure-modes)

---

## Executive Summary

### Vision
Automate the complete domain-to-deployment process, reducing launch time from 30-60 minutes (manual) to 3-5 minutes (automated) for Business in a Box customers.

### Core Value Proposition
- **Customer:** "Click button → website live on custom domain in 15 minutes"
- **Business:** Premium $99 add-on or included in Turnkey tier ($497)
- **Competitive Moat:** No other service automates end-to-end domain purchase + deployment

### High-Level Architecture
```
User Input (Domain + Payment)
    ↓
LaunchOrchestratorAgent
    ↓
┌──────────────────────────────────────────────┐
│ 1. DomainSearchAgent                         │
│ 2. DomainPurchaseAgent                       │
│ 3. DNSConfigAgent                            │
│ 4. VercelDeploymentAgent                     │
│ 5. LaunchVerificationAgent                   │
│ 6. PostLaunchAgent                           │
└──────────────────────────────────────────────┘
    ↓
Live Website + Launch Report
```

### Success Metrics
- **Launch Time:** < 15 minutes (95th percentile)
- **Success Rate:** > 95% (automated launches complete successfully)
- **User Satisfaction:** > 4.5/5 stars
- **Cost per Launch:** < $5 (API fees)
- **Revenue per Launch:** $99 (add-on) or bundled in $497 tier

---

## System Overview

### Architecture Pattern
**Agent-Based Orchestration** using LangGraph for state management and execution flow.

### Key Design Principles

1. **Idempotency:** Every operation can be safely retried
2. **Transparency:** User sees exactly what's happening in real-time
3. **Fault Tolerance:** Graceful degradation if APIs fail
4. **Security First:** Never store credentials; use secure token flows
5. **Auditability:** Every action logged for debugging and compliance

### System Boundaries

**In Scope:**
- Domain availability search
- Domain purchase (via Namecheap API)
- DNS configuration (A/CNAME records)
- Vercel domain connection
- SSL certificate provisioning
- Launch verification
- Google Analytics setup
- Search Console submission

**Out of Scope (Phase 1):**
- Email hosting setup
- Advanced DNS (MX records, subdomains)
- Multi-domain deployments
- Domain transfers (only new purchases)
- Custom nameserver configuration

---

## Agent Architecture

### 1. LaunchOrchestratorAgent

**Responsibility:** Coordinate all launch agents; maintain workflow state.

**Key Capabilities:**
- Execute agents in correct sequence
- Handle dependencies (DNS must complete before Vercel)
- Retry failed steps with exponential backoff
- Aggregate progress updates for UI
- Generate final launch report

**State Machine:**
```
IDLE → SEARCHING → PURCHASING → CONFIGURING_DNS →
DEPLOYING → VERIFYING → POST_LAUNCH → COMPLETED
                      ↓ (any step)
                    FAILED
```

**Decision Points:**
- If domain unavailable → suggest alternatives or fail gracefully
- If payment fails → halt and notify user
- If DNS propagation timeout → continue monitoring in background
- If verification fails → retry with diagnostic logging

**Data Flow:**
```typescript
interface OrchestrationContext {
  userId: string;
  projectId: string;
  desiredDomain: string;
  registrar: 'namecheap' | 'godaddy' | 'cloudflare';
  vercelProjectId: string;

  // State
  currentStep: LaunchStep;
  domainSearchResult?: DomainSearchResult;
  purchaseResult?: PurchaseResult;
  dnsConfigResult?: DNSConfigResult;
  deploymentResult?: DeploymentResult;
  verificationResult?: VerificationResult;

  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletionAt?: Date;

  // Error handling
  errors: AgentError[];
  retryCount: { [key: string]: number };
}
```

**Algorithm (Pseudocode):**
```typescript
async function executeWorkflow(ctx: OrchestrationContext) {
  try {
    // Step 1: Search
    ctx.currentStep = 'SEARCHING';
    const searchResult = await domainSearchAgent.execute({
      domain: ctx.desiredDomain,
      registrar: ctx.registrar,
    });

    if (!searchResult.available) {
      return await handleUnavailableDomain(ctx, searchResult);
    }
    ctx.domainSearchResult = searchResult;

    // Step 2: Purchase
    ctx.currentStep = 'PURCHASING';
    const purchaseResult = await domainPurchaseAgent.execute({
      domain: ctx.desiredDomain,
      registrar: ctx.registrar,
      userId: ctx.userId,
      pricing: searchResult.pricing,
    });

    if (!purchaseResult.success) {
      return await handlePurchaseFailure(ctx, purchaseResult);
    }
    ctx.purchaseResult = purchaseResult;

    // Step 3: DNS Config
    ctx.currentStep = 'CONFIGURING_DNS';
    const dnsResult = await dnsConfigAgent.execute({
      domain: ctx.desiredDomain,
      registrar: ctx.registrar,
      registrarCredentials: purchaseResult.apiCredentials,
    });

    if (!dnsResult.success) {
      return await handleDNSFailure(ctx, dnsResult);
    }
    ctx.dnsConfigResult = dnsResult;

    // Step 4: Vercel Deployment
    ctx.currentStep = 'DEPLOYING';
    const deployResult = await vercelDeploymentAgent.execute({
      domain: ctx.desiredDomain,
      vercelProjectId: ctx.vercelProjectId,
    });

    // Step 5: Verification (async - can take 5-30 min)
    ctx.currentStep = 'VERIFYING';
    const verifyResult = await launchVerificationAgent.execute({
      domain: ctx.desiredDomain,
      maxWaitTime: 30 * 60 * 1000, // 30 minutes
    });

    // Step 6: Post-launch (optional)
    ctx.currentStep = 'POST_LAUNCH';
    await postLaunchAgent.execute({
      domain: ctx.desiredDomain,
      userId: ctx.userId,
    });

    ctx.currentStep = 'COMPLETED';
    ctx.completedAt = new Date();

    return {
      success: true,
      liveUrl: `https://${ctx.desiredDomain}`,
      report: generateLaunchReport(ctx),
    };

  } catch (error) {
    ctx.currentStep = 'FAILED';
    return await handleCatastrophicFailure(ctx, error);
  }
}
```

---

### 2. DomainSearchAgent

**Responsibility:** Check domain availability and pricing across registrars.

**Input:**
```typescript
interface DomainSearchInput {
  domain: string; // e.g., "mybusiness.com"
  registrar: 'namecheap' | 'godaddy' | 'cloudflare';
  checkAlternatives?: boolean; // If true, suggest .io, .co, etc.
  checkSocialHandles?: boolean; // Check Instagram, Twitter availability
}
```

**Output:**
```typescript
interface DomainSearchResult {
  available: boolean;
  domain: string;
  pricing: {
    registrar: string;
    yearlyPrice: number; // USD
    renewalPrice: number;
    currency: 'USD';
  };
  alternatives?: Array<{
    domain: string;
    available: boolean;
    price: number;
  }>;
  socialHandles?: {
    twitter: boolean;
    instagram: boolean;
    facebook: boolean;
  };
  whoisPrivacyIncluded: boolean;
  estimatedPurchaseTime: number; // seconds
}
```

**API Integrations:**
- **Namecheap:** `domains.check` API
- **GoDaddy:** Domain availability API
- **Cloudflare:** Registrar API

**Algorithm:**
```typescript
async function searchDomain(input: DomainSearchInput): Promise<DomainSearchResult> {
  // 1. Validate domain format
  if (!isValidDomain(input.domain)) {
    throw new Error('Invalid domain format');
  }

  // 2. Check cache (avoid redundant API calls)
  const cached = await getCachedAvailability(input.domain);
  if (cached && !isStale(cached)) {
    return cached;
  }

  // 3. Call registrar API
  const availability = await checkRegistrarAvailability(
    input.domain,
    input.registrar
  );

  // 4. Get pricing
  const pricing = await getRegistrarPricing(
    input.domain,
    input.registrar
  );

  // 5. Check alternatives if requested
  let alternatives;
  if (input.checkAlternatives && !availability.available) {
    alternatives = await checkAlternativeDomains(input.domain);
  }

  // 6. Check social handles if requested
  let socialHandles;
  if (input.checkSocialHandles) {
    socialHandles = await checkSocialAvailability(
      extractBrandName(input.domain)
    );
  }

  // 7. Cache result
  await cacheAvailability(input.domain, result);

  return {
    available: availability.available,
    domain: input.domain,
    pricing,
    alternatives,
    socialHandles,
    whoisPrivacyIncluded: true, // Namecheap includes free
    estimatedPurchaseTime: 60, // 1 minute
  };
}
```

**Error Scenarios:**
- Registrar API down → Retry 3x with exponential backoff, then fail gracefully
- Invalid domain → Return clear error to user
- Rate limited → Queue request and retry after cooldown

---

### 3. DomainPurchaseAgent

**Responsibility:** Complete domain registration with payment processing.

**Input:**
```typescript
interface DomainPurchaseInput {
  domain: string;
  registrar: 'namecheap' | 'godaddy' | 'cloudflare';
  userId: string;
  pricing: PricingInfo;

  // Payment
  paymentMethodId: string; // Stripe payment method ID

  // Optional WHOIS data (use privacy if not provided)
  whoisData?: {
    firstName: string;
    lastName: string;
    organization?: string;
    email: string;
    phone: string;
    address: Address;
  };
}
```

**Output:**
```typescript
interface DomainPurchaseResult {
  success: boolean;
  domain: string;
  registrar: string;
  orderId: string; // Registrar's order ID
  expiresAt: Date; // 1 year from now

  // For DNS config
  apiCredentials: {
    apiKey: string; // Encrypted, stored securely
    apiUser: string;
    clientIp: string;
  };

  // Payment
  stripeChargeId: string;
  amountCharged: number;

  // Auto-renew
  autoRenewEnabled: boolean;

  error?: string;
}
```

**Workflow:**
```
1. Validate payment method (Stripe)
2. Create pending order in our database
3. Charge user via Stripe
4. If payment succeeds:
   a. Call registrar purchase API
   b. Enable WHOIS privacy
   c. Enable auto-renew
   d. Store API credentials (encrypted)
   e. Update order status → COMPLETED
5. If payment fails:
   a. Update order status → FAILED
   b. Return error to user
6. If registrar API fails after payment:
   a. Initiate refund
   b. Log error for manual resolution
   c. Alert engineering team
```

**Security Considerations:**
- Payment method never stored (use Stripe tokens)
- Registrar API keys encrypted at rest (AWS KMS or similar)
- Credentials scoped to single domain (least privilege)
- All transactions logged for audit trail

**Payment Flow:**
```typescript
async function purchaseDomain(input: DomainPurchaseInput): Promise<DomainPurchaseResult> {
  // 1. Create pending order
  const order = await createPendingOrder({
    userId: input.userId,
    domain: input.domain,
    amount: input.pricing.yearlyPrice,
  });

  try {
    // 2. Charge via Stripe
    const charge = await stripe.charges.create({
      amount: input.pricing.yearlyPrice * 100, // cents
      currency: 'usd',
      payment_method: input.paymentMethodId,
      description: `Domain registration: ${input.domain}`,
      metadata: {
        orderId: order.id,
        domain: input.domain,
        registrar: input.registrar,
      },
    });

    // 3. Purchase domain via registrar API
    const registrarResult = await purchaseViaRegistrar({
      domain: input.domain,
      registrar: input.registrar,
      whoisData: input.whoisData || generatePrivacyWhois(),
    });

    // 4. Enable WHOIS privacy
    await enableWhoisPrivacy(input.domain, input.registrar);

    // 5. Enable auto-renew
    await enableAutoRenew(input.domain, input.registrar);

    // 6. Store API credentials (encrypted)
    const credentials = await storeRegistrarCredentials({
      userId: input.userId,
      domain: input.domain,
      registrar: input.registrar,
      apiKey: registrarResult.apiKey,
    });

    // 7. Update order
    await updateOrder(order.id, {
      status: 'COMPLETED',
      registrarOrderId: registrarResult.orderId,
      stripeChargeId: charge.id,
    });

    return {
      success: true,
      domain: input.domain,
      registrar: input.registrar,
      orderId: registrarResult.orderId,
      expiresAt: addYears(new Date(), 1),
      apiCredentials: credentials,
      stripeChargeId: charge.id,
      amountCharged: input.pricing.yearlyPrice,
      autoRenewEnabled: true,
    };

  } catch (error) {
    // Payment succeeded but registrar failed → REFUND
    if (charge && !registrarResult) {
      await stripe.refunds.create({ charge: charge.id });
      await updateOrder(order.id, {
        status: 'REFUNDED',
        error: error.message,
      });
      await alertEngineering({
        severity: 'high',
        message: `Domain purchase failed after payment: ${input.domain}`,
        error,
      });
    }

    await updateOrder(order.id, {
      status: 'FAILED',
      error: error.message,
    });

    return {
      success: false,
      domain: input.domain,
      registrar: input.registrar,
      error: error.message,
    };
  }
}
```

**Critical Edge Case: Payment Success + Registrar Failure**
- **Problem:** User charged but domain not registered
- **Solution:**
  1. Automatic refund via Stripe
  2. Alert engineering team
  3. Manual resolution within 24 hours
  4. Offer user: retry with credits OR full refund + apology

---

### 4. DNSConfigAgent

**Responsibility:** Configure DNS records at registrar to point to Vercel.

**Input:**
```typescript
interface DNSConfigInput {
  domain: string;
  registrar: 'namecheap' | 'godaddy' | 'cloudflare';
  registrarCredentials: RegistrarCredentials;

  // DNS records to add
  records?: DNSRecord[]; // Default: A + CNAME for Vercel
}

interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT' | 'MX';
  host: string; // '@', 'www', 'mail'
  value: string;
  ttl?: number; // Default: 3600 (1 hour)
}
```

**Output:**
```typescript
interface DNSConfigResult {
  success: boolean;
  domain: string;
  recordsAdded: DNSRecord[];
  propagationEstimate: number; // seconds
  verificationUrl: string; // For DNS checker
  error?: string;
}
```

**Default Vercel DNS Records:**
```typescript
const VERCEL_DNS_RECORDS: DNSRecord[] = [
  {
    type: 'A',
    host: '@',
    value: '76.76.21.21',
    ttl: 3600,
  },
  {
    type: 'CNAME',
    host: 'www',
    value: 'cname.vercel-dns.com',
    ttl: 3600,
  },
];
```

**Algorithm:**
```typescript
async function configureDNS(input: DNSConfigInput): Promise<DNSConfigResult> {
  const records = input.records || VERCEL_DNS_RECORDS;

  try {
    // 1. Authenticate with registrar
    const client = await getRegistrarClient(
      input.registrar,
      input.registrarCredentials
    );

    // 2. Get current DNS records
    const existingRecords = await client.getDNSRecords(input.domain);

    // 3. Remove conflicting records (e.g., existing A/@)
    for (const existing of existingRecords) {
      if (conflictsWithNewRecords(existing, records)) {
        await client.deleteDNSRecord(input.domain, existing.id);
      }
    }

    // 4. Add new records
    const addedRecords = [];
    for (const record of records) {
      const result = await client.addDNSRecord(input.domain, record);
      addedRecords.push(result);
    }

    // 5. Verify records were added
    const verification = await client.getDNSRecords(input.domain);
    const allAdded = records.every(r =>
      verification.some(v => v.host === r.host && v.value === r.value)
    );

    if (!allAdded) {
      throw new Error('DNS records not verified after addition');
    }

    return {
      success: true,
      domain: input.domain,
      recordsAdded: addedRecords,
      propagationEstimate: 1800, // 30 minutes
      verificationUrl: `https://dnschecker.org/#A/${input.domain}`,
    };

  } catch (error) {
    return {
      success: false,
      domain: input.domain,
      recordsAdded: [],
      propagationEstimate: 0,
      verificationUrl: '',
      error: error.message,
    };
  }
}
```

**DNS Propagation Monitoring:**
```typescript
async function monitorDNSPropagation(
  domain: string,
  expectedRecords: DNSRecord[],
  maxWaitTime: number = 30 * 60 * 1000 // 30 min
): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 60 * 1000; // Check every minute

  while (Date.now() - startTime < maxWaitTime) {
    // Check DNS from multiple locations
    const results = await checkDNSFromMultipleServers(domain);

    // If 80%+ of servers show correct records → propagated
    const propagationRate = calculatePropagationRate(results, expectedRecords);

    if (propagationRate >= 0.8) {
      return true;
    }

    await sleep(checkInterval);
  }

  return false; // Timeout
}
```

---

### 5. VercelDeploymentAgent

**Responsibility:** Connect custom domain to Vercel project and provision SSL.

**Input:**
```typescript
interface VercelDeploymentInput {
  domain: string;
  vercelProjectId: string;
  vercelTeamId?: string; // If using team account
}
```

**Output:**
```typescript
interface VercelDeploymentResult {
  success: boolean;
  domain: string;
  vercelProjectId: string;
  sslCertificate: {
    issued: boolean;
    issuer: string; // "Let's Encrypt"
    expiresAt: Date; // 90 days
  };
  deploymentUrls: {
    production: string; // https://domain.com
    www: string; // https://www.domain.com
  };
  error?: string;
}
```

**API Calls:**
```typescript
async function deployToVercel(input: VercelDeploymentInput): Promise<VercelDeploymentResult> {
  const vercelClient = createVercelClient(process.env.VERCEL_TOKEN);

  try {
    // 1. Add domain to Vercel project
    const domainResponse = await vercelClient.addDomain({
      name: input.domain,
      projectId: input.vercelProjectId,
      teamId: input.vercelTeamId,
    });

    // 2. Add www subdomain
    const wwwResponse = await vercelClient.addDomain({
      name: `www.${input.domain}`,
      projectId: input.vercelProjectId,
      teamId: input.vercelTeamId,
      redirect: input.domain, // Redirect www → apex
    });

    // 3. Wait for SSL certificate
    const ssl = await waitForSSL(input.domain, {
      maxWaitTime: 10 * 60 * 1000, // 10 minutes
      checkInterval: 30 * 1000, // 30 seconds
    });

    if (!ssl.issued) {
      throw new Error('SSL certificate provisioning failed');
    }

    return {
      success: true,
      domain: input.domain,
      vercelProjectId: input.vercelProjectId,
      sslCertificate: ssl,
      deploymentUrls: {
        production: `https://${input.domain}`,
        www: `https://www.${input.domain}`,
      },
    };

  } catch (error) {
    return {
      success: false,
      domain: input.domain,
      vercelProjectId: input.vercelProjectId,
      error: error.message,
    };
  }
}

async function waitForSSL(
  domain: string,
  options: { maxWaitTime: number; checkInterval: number }
): Promise<SSLCertificate> {
  const startTime = Date.now();

  while (Date.now() - startTime < options.maxWaitTime) {
    const cert = await checkSSLCertificate(domain);

    if (cert.issued && cert.validUntil > new Date()) {
      return cert;
    }

    await sleep(options.checkInterval);
  }

  throw new Error('SSL certificate timeout');
}
```

---

### 6. LaunchVerificationAgent

**Responsibility:** Comprehensive testing to ensure site is live and functional.

**Input:**
```typescript
interface LaunchVerificationInput {
  domain: string;
  vercelProjectId: string;
  testUrls?: string[]; // Additional URLs to test (e.g., /about, /contact)
  runLighthouse?: boolean; // Performance audit
}
```

**Output:**
```typescript
interface LaunchVerificationResult {
  success: boolean;
  domain: string;

  checks: {
    dns: {
      aRecord: boolean;
      cnameRecord: boolean;
      propagated: boolean;
    };
    ssl: {
      valid: boolean;
      issuer: string;
      expiresAt: Date;
    };
    http: {
      apex: boolean; // https://domain.com loads
      www: boolean; // https://www.domain.com loads
      redirects: boolean; // http → https works
    };
    pages: {
      url: string;
      statusCode: number;
      loadTime: number; // ms
      passed: boolean;
    }[];
    performance?: {
      score: number; // Lighthouse score 0-100
      metrics: {
        fcp: number; // First Contentful Paint
        lcp: number; // Largest Contentful Paint
        tbt: number; // Total Blocking Time
        cls: number; // Cumulative Layout Shift
      };
    };
  };

  errors: string[];
}
```

**Test Suite:**
```typescript
async function verifyLaunch(input: LaunchVerificationInput): Promise<LaunchVerificationResult> {
  const errors: string[] = [];

  // 1. DNS Checks
  const dnsChecks = await verifyDNS(input.domain);
  if (!dnsChecks.aRecord) errors.push('A record not found');
  if (!dnsChecks.cnameRecord) errors.push('CNAME record not found');

  // 2. SSL Checks
  const sslChecks = await verifySSL(input.domain);
  if (!sslChecks.valid) errors.push('SSL certificate invalid');

  // 3. HTTP Checks
  const httpChecks = {
    apex: await testURL(`https://${input.domain}`),
    www: await testURL(`https://www.${input.domain}`),
    redirects: await testRedirect(`http://${input.domain}`, `https://${input.domain}`),
  };

  // 4. Page Tests
  const testUrls = input.testUrls || ['/', '/about', '/contact'];
  const pageChecks = await Promise.all(
    testUrls.map(async (path) => {
      const fullUrl = `https://${input.domain}${path}`;
      const start = Date.now();

      try {
        const response = await fetch(fullUrl);
        const loadTime = Date.now() - start;

        return {
          url: fullUrl,
          statusCode: response.status,
          loadTime,
          passed: response.status === 200 && loadTime < 3000,
        };
      } catch (error) {
        errors.push(`Failed to load ${fullUrl}: ${error.message}`);
        return {
          url: fullUrl,
          statusCode: 0,
          loadTime: 0,
          passed: false,
        };
      }
    })
  );

  // 5. Performance Audit (optional)
  let performance;
  if (input.runLighthouse) {
    performance = await runLighthouseAudit(`https://${input.domain}`);
  }

  return {
    success: errors.length === 0,
    domain: input.domain,
    checks: {
      dns: dnsChecks,
      ssl: sslChecks,
      http: httpChecks,
      pages: pageChecks,
      performance,
    },
    errors,
  };
}
```

---

### 7. PostLaunchAgent

**Responsibility:** Setup analytics, monitoring, and search engine submission.

**Input:**
```typescript
interface PostLaunchInput {
  domain: string;
  userId: string;
  enableAnalytics?: boolean; // Default: true
  submitToSearchEngines?: boolean; // Default: true
  setupMonitoring?: boolean; // Default: true
}
```

**Output:**
```typescript
interface PostLaunchResult {
  success: boolean;

  analytics?: {
    googleAnalyticsId: string;
    trackingCodeInstalled: boolean;
  };

  searchEngines?: {
    googleSearchConsole: {
      submitted: boolean;
      verificationMethod: string;
      sitemapUrl: string;
    };
  };

  monitoring?: {
    uptimeMonitor: {
      enabled: boolean;
      checkInterval: number; // seconds
      alertEmail: string;
    };
  };
}
```

**Implementation:**
```typescript
async function postLaunchSetup(input: PostLaunchInput): Promise<PostLaunchResult> {
  const result: PostLaunchResult = { success: true };

  // 1. Google Analytics
  if (input.enableAnalytics) {
    const ga = await setupGoogleAnalytics({
      domain: input.domain,
      userId: input.userId,
    });
    result.analytics = ga;
  }

  // 2. Search Console
  if (input.submitToSearchEngines) {
    const gsc = await submitToGoogleSearchConsole({
      domain: input.domain,
      userId: input.userId,
    });
    result.searchEngines = { googleSearchConsole: gsc };
  }

  // 3. Uptime Monitoring
  if (input.setupMonitoring) {
    const monitoring = await setupUptimeMonitoring({
      domain: input.domain,
      userId: input.userId,
    });
    result.monitoring = monitoring;
  }

  return result;
}
```

---

## Data Models

### Database Schema (Prisma)

```prisma
// Launch workflows
model LaunchWorkflow {
  id                String         @id @default(cuid())
  userId            String
  projectId         String

  // Domain
  desiredDomain     String
  actualDomain      String?
  registrar         Registrar

  // State
  status            LaunchStatus
  currentStep       LaunchStep
  progress          Int            @default(0) // 0-100

  // Results
  domainSearchResult   Json?
  purchaseResult       Json?
  dnsConfigResult      Json?
  deploymentResult     Json?
  verificationResult   Json?

  // Timing
  startedAt         DateTime       @default(now())
  completedAt       DateTime?
  estimatedCompletionAt DateTime?

  // Error tracking
  errors            LaunchError[]
  retryCount        Json           @default("{}")

  // Relations
  user              User           @relation(fields: [userId], references: [id])
  project           Project        @relation(fields: [projectId], references: [id])
  domainRegistration DomainRegistration?

  @@index([userId])
  @@index([projectId])
  @@index([status])
}

enum LaunchStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}

enum LaunchStep {
  SEARCHING
  PURCHASING
  CONFIGURING_DNS
  DEPLOYING
  VERIFYING
  POST_LAUNCH
}

enum Registrar {
  NAMECHEAP
  GODADDY
  CLOUDFLARE
}

// Domain registrations
model DomainRegistration {
  id                String         @id @default(cuid())
  userId            String
  workflowId        String         @unique

  // Domain info
  domain            String         @unique
  registrar         Registrar

  // Registrar details
  registrarOrderId  String
  registrarAccountId String?

  // Payment
  stripeChargeId    String
  amountPaid        Decimal
  currency          String         @default("USD")

  // Dates
  purchasedAt       DateTime       @default(now())
  expiresAt         DateTime

  // Auto-renew
  autoRenewEnabled  Boolean        @default(true)
  renewalPrice      Decimal?

  // WHOIS
  whoisPrivacy      Boolean        @default(true)
  whoisData         Json?

  // API credentials (encrypted)
  apiCredentialsEncrypted String?

  // Relations
  user              User           @relation(fields: [userId], references: [id])
  workflow          LaunchWorkflow @relation(fields: [workflowId], references: [id])

  @@index([userId])
  @@index([domain])
}

// Error tracking
model LaunchError {
  id                String         @id @default(cuid())
  workflowId        String

  // Error details
  step              LaunchStep
  errorType         String
  errorMessage      String
  stackTrace        String?

  // Context
  attemptNumber     Int
  retriable         Boolean
  retried           Boolean        @default(false)

  // Timing
  occurredAt        DateTime       @default(now())

  // Relations
  workflow          LaunchWorkflow @relation(fields: [workflowId], references: [id])

  @@index([workflowId])
}

// Agent execution logs
model AgentExecutionLog {
  id                String         @id @default(cuid())
  workflowId        String

  // Agent info
  agentName         String
  agentVersion      String

  // Input/Output
  input             Json
  output            Json?

  // Execution
  status            String         // success, failure, timeout
  executionTime     Int            // milliseconds
  tokensUsed        Int?           // AI tokens

  // Timing
  startedAt         DateTime
  completedAt       DateTime?

  @@index([workflowId])
  @@index([agentName])
}
```

---

## API Integrations

### Namecheap Domain API

**Base URL:** `https://api.namecheap.com/xml.response`

**Authentication:**
- API Key
- API User
- Client IP (must be whitelisted)

**Key Endpoints:**

1. **Check Domain Availability**
```
GET /xml.response
?ApiUser={user}
&ApiKey={key}
&UserName={user}
&ClientIp={ip}
&Command=namecheap.domains.check
&DomainList=example.com,example.net
```

Response:
```xml
<DomainCheckResult Domain="example.com" Available="true" />
```

2. **Purchase Domain**
```
POST /xml.response
?Command=namecheap.domains.create
&DomainName=example.com
&Years=1
&PromotionCode=
&Registrant...={whois_data}
&AddFreeWhoisguard=yes
&WGEnabled=yes
```

3. **Set DNS Records**
```
POST /xml.response
?Command=namecheap.domains.dns.setHosts
&SLD=example
&TLD=com
&HostName1=@
&RecordType1=A
&Address1=76.76.21.21
&TTL1=3600
&HostName2=www
&RecordType2=CNAME
&Address2=cname.vercel-dns.com
&TTL2=3600
```

**Error Handling:**
- Rate limits: 20 calls/minute for sandbox, 700/5min for production
- Retry with exponential backoff: 1s, 2s, 4s, 8s
- Cache availability checks for 5 minutes

---

### Vercel API

**Base URL:** `https://api.vercel.com`

**Authentication:**
- Bearer token in `Authorization` header

**Key Endpoints:**

1. **Add Domain to Project**
```
POST /v9/projects/{projectId}/domains
Authorization: Bearer {token}

{
  "name": "example.com"
}
```

Response:
```json
{
  "name": "example.com",
  "apexName": "example.com",
  "projectId": "prj_...",
  "verified": false,
  "verification": [{
    "type": "TXT",
    "domain": "_vercel",
    "value": "vc-domain-verify=...",
    "reason": "pending"
  }]
}
```

2. **Check SSL Certificate**
```
GET /v6/certs/{certId}
Authorization: Bearer {token}
```

3. **Get Domain Configuration**
```
GET /v9/projects/{projectId}/domains/{domain}
Authorization: Bearer {token}
```

**Auto-verification:**
Vercel automatically verifies domains once DNS is configured correctly. No manual verification needed if DNS points to Vercel IPs.

---

### Stripe Payment API

**Already Integrated** - Just need to extend for domain purchases.

**Flow:**
1. Create PaymentIntent for domain price
2. Confirm payment with payment method
3. On success → trigger domain purchase
4. On failure → return error to user
5. If domain purchase fails after payment → refund automatically

---

### Google Analytics API

**For automated GA setup:**

**OAuth Flow:**
1. User grants permission (one-time)
2. Store refresh token (encrypted)
3. Create GA4 property via Management API
4. Get tracking ID
5. Inject tracking code into site

**Alternative:** Just provide manual instructions + tracking code

---

## State Management

### LangGraph Workflow

```typescript
import { StateGraph, END } from "@langchain/langgraph";

// Define state
interface LaunchState {
  domain: string;
  userId: string;
  projectId: string;
  registrar: Registrar;

  // Step results
  searchResult?: DomainSearchResult;
  purchaseResult?: DomainPurchaseResult;
  dnsResult?: DNSConfigResult;
  deployResult?: VercelDeploymentResult;
  verifyResult?: LaunchVerificationResult;

  // Control flow
  currentStep: LaunchStep;
  errors: Error[];
  completed: boolean;
}

// Define graph
const workflow = new StateGraph<LaunchState>({
  channels: {
    domain: null,
    userId: null,
    projectId: null,
    registrar: null,
    searchResult: null,
    purchaseResult: null,
    dnsResult: null,
    deployResult: null,
    verifyResult: null,
    currentStep: null,
    errors: null,
    completed: false,
  },
});

// Add nodes (agents)
workflow.addNode("search", domainSearchNode);
workflow.addNode("purchase", domainPurchaseNode);
workflow.addNode("configureDNS", dnsConfigNode);
workflow.addNode("deploy", vercelDeployNode);
workflow.addNode("verify", verificationNode);
workflow.addNode("postLaunch", postLaunchNode);

// Define edges (flow)
workflow.addEdge("__start__", "search");

workflow.addConditionalEdges("search", (state) => {
  if (!state.searchResult?.available) {
    return "suggestAlternatives"; // Terminal node
  }
  return "purchase";
});

workflow.addConditionalEdges("purchase", (state) => {
  if (!state.purchaseResult?.success) {
    return END; // Failed
  }
  return "configureDNS";
});

workflow.addEdge("configureDNS", "deploy");
workflow.addEdge("deploy", "verify");

workflow.addConditionalEdges("verify", (state) => {
  if (state.verifyResult?.success) {
    return "postLaunch";
  }
  // Retry verification?
  return END;
});

workflow.addEdge("postLaunch", END);

// Compile
const app = workflow.compile();
```

**Streaming Updates:**
```typescript
for await (const event of app.stream(initialState)) {
  // Send real-time updates to UI
  await sendProgressUpdate(event);
}
```

---

## Error Handling & Recovery

### Error Classification

**1. Retriable Errors** (Auto-retry)
- Network timeouts
- Rate limiting (429)
- Temporary API unavailability (503)
- DNS propagation pending

**Strategy:** Exponential backoff (1s, 2s, 4s, 8s, 16s, max 5 retries)

**2. User Errors** (Notify user)
- Invalid domain format
- Payment declined
- Insufficient funds
- Domain already taken (race condition)

**Strategy:** Clear error message + suggested actions

**3. System Errors** (Alert engineering)
- API credentials invalid
- Unexpected API response
- Database failure
- Encryption/decryption failure

**Strategy:** Rollback + alert + manual intervention

**4. Catastrophic Errors** (Full rollback)
- Payment succeeded but domain purchase failed
- DNS configured but Vercel deploy failed

**Strategy:**
1. Attempt automatic rollback
2. Refund user if applicable
3. Alert engineering with high priority
4. Manual resolution within 24 hours

### Rollback Strategy

```typescript
async function rollbackWorkflow(
  workflow: LaunchWorkflow,
  failedAt: LaunchStep
): Promise<void> {

  switch (failedAt) {
    case 'PURCHASING':
      // No rollback needed - payment failed
      break;

    case 'CONFIGURING_DNS':
      // Rollback: Refund domain purchase
      await refundDomainPurchase(workflow.domainRegistration);
      break;

    case 'DEPLOYING':
      // Rollback: Remove DNS records + refund
      await removeDNSRecords(workflow.dnsConfigResult);
      await refundDomainPurchase(workflow.domainRegistration);
      break;

    case 'VERIFYING':
      // Don't rollback - let verification retry in background
      // User can still manually configure if needed
      break;
  }

  await updateWorkflowStatus(workflow.id, 'FAILED');
  await notifyUser(workflow.userId, {
    type: 'LAUNCH_FAILED',
    step: failedAt,
    refundIssued: failedAt !== 'SEARCHING',
  });
}
```

---

## Security & Compliance

### Payment Security

**PCI Compliance:**
- Never store credit card numbers
- Use Stripe tokens only
- All payment flows over HTTPS
- Stripe handles PCI compliance

### API Credential Management

**Encryption:**
- All registrar API keys encrypted at rest using AWS KMS
- Encryption keys rotated every 90 days
- Decrypt only when needed, never log decrypted values

**Access Control:**
- API credentials scoped to single domain
- Least privilege (can only modify that domain's DNS)
- Credentials expire after 1 year
- User can revoke access anytime

### WHOIS Privacy

**Default:** Always enable WHOIS privacy
- User's personal info never exposed in WHOIS
- Use registrar's privacy service
- Free with Namecheap

### Data Retention

- Workflow logs: 90 days
- Error logs: 1 year
- Payment records: 7 years (legal requirement)
- API credentials: Until domain expires or user deletes

### GDPR Compliance

- User can export all launch data
- User can delete launch workflows
- Encrypted credentials are truly deleted (not soft delete)

---

## User Experience Flow

### UI/UX Mockup

**Page:** `/launch` (or modal on dashboard)

```
┌────────────────────────────────────────────┐
│  Launch Your Site                          │
│  Connect a custom domain in minutes        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Step 1: Choose Your Domain                │
│                                            │
│  [example.com         ] [Check]            │
│                                            │
│  ✓ example.com is available!              │
│  Price: $9.99/year (Namecheap)            │
│                                            │
│  Also available:                           │
│  • example.io - $34.99/year               │
│  • example.co - $24.99/year               │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Step 2: Payment                           │
│                                            │
│  [ ] Use saved payment method              │
│  [Stripe Card Element]                     │
│                                            │
│  Total: $9.99/year + $99 setup = $108.99  │
│                                            │
│  [Purchase & Launch →]                     │
└────────────────────────────────────────────┘
```

**After clicking "Purchase & Launch":**

```
┌────────────────────────────────────────────┐
│  🚀 Launching example.com...               │
│                                            │
│  [████████████░░░░░░░░] 65%               │
│                                            │
│  ✓ Domain registered                       │
│  ✓ WHOIS privacy enabled                   │
│  ✓ DNS configured                          │
│  ⏳ Waiting for DNS propagation...         │
│     (5-30 minutes)                         │
│  ⏹ Connecting to Vercel...                │
│  ⏹ Provisioning SSL certificate...        │
│  ⏹ Verifying deployment...                │
│                                            │
│  [View Live Progress]                      │
└────────────────────────────────────────────┘
```

**Completion:**

```
┌────────────────────────────────────────────┐
│  🎉 Your Site Is Live!                     │
│                                            │
│  https://example.com                       │
│                                            │
│  ✓ Domain: example.com                     │
│  ✓ SSL: Valid (Let's Encrypt)             │
│  ✓ Performance: 95/100                     │
│  ✓ Launch time: 8 minutes                  │
│                                            │
│  [Visit Your Site]  [View Report]          │
└────────────────────────────────────────────┘
```

### Real-Time Progress Updates

**Using Server-Sent Events (SSE):**

```typescript
// Client
const eventSource = new EventSource(`/api/launch/${workflowId}/stream`);

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);

  setProgress(update.progress);
  setCurrentStep(update.step);
  setMessage(update.message);
};

// Server
export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const workflow = await getWorkflow(workflowId);

      // Subscribe to workflow updates
      workflow.on('progress', (data) => {
        controller.enqueue(
          `data: ${JSON.stringify(data)}\n\n`
        );
      });

      workflow.on('complete', () => {
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

## Cost Analysis

### Per-Launch Costs

**Domain Purchase:**
- Namecheap .com: ~$9-12
- Customer pays directly (not our cost)

**API Usage:**
| Service | Cost per Launch | Notes |
|---------|----------------|-------|
| Namecheap API | Free | Included with domain purchase |
| Vercel API | Free | Included with Vercel plan |
| Stripe | 2.9% + $0.30 | ~$3.44 for $108.99 charge |
| OpenAI (agent LLM) | ~$0.50 | Minimal - mostly orchestration |
| DNS Checker APIs | Free | Use public DNS servers |
| Total | **~$4** | |

**Infrastructure:**
- Database: Negligible (small records)
- Storage: Minimal (logs)
- Compute: < $0.10 per launch

**Total Cost per Launch: ~$4-5**

### Revenue Model

**Option 1: Add-on**
- Base BIAB: $197 (no domain)
- + Instant Launch: $99
- Total: $296
- Margin: $99 - $4 = **$95 profit** (95% margin)

**Option 2: Bundle in Turnkey**
- Turnkey tier: $497
- Includes instant launch
- Margin remains high since launch cost is only $4

**Option 3: À la carte**
- $49 per domain launch
- Can launch multiple domains for one project
- Margin: $49 - $4 = **$45 profit** (92% margin)

**Recommendation:**
- Include in Turnkey ($497) as premium feature
- Offer as $99 add-on for Launch Blueprint ($197)
- Upsell opportunity during checkout

---

## Technical Dependencies

### Required NPM Packages

```json
{
  "dependencies": {
    "@langchain/langgraph": "^0.0.19",
    "@langchain/anthropic": "^0.1.0",
    "stripe": "^14.0.0",
    "jszip": "^3.10.1",

    // DNS & Network
    "dns-packet": "^5.6.0",
    "node-fetch": "^3.3.0",

    // Encryption
    "aws-sdk": "^2.1400.0", // For KMS

    // Registrar APIs
    "axios": "^1.6.0"
  }
}
```

### Environment Variables

```bash
# Existing
DATABASE_URL=
STRIPE_SECRET_KEY=
VERCEL_TOKEN=
ANTHROPIC_API_KEY=

# New - Domain Registrars
NAMECHEAP_API_KEY=
NAMECHEAP_API_USER=
NAMECHEAP_CLIENT_IP=

# New - Encryption
AWS_KMS_KEY_ID=
AWS_REGION=us-east-1

# New - Analytics (optional)
GOOGLE_ANALYTICS_API_CLIENT_ID=
GOOGLE_ANALYTICS_API_CLIENT_SECRET=
```

### External Services

1. **Namecheap** - Domain registration
   - Need: Production API account
   - Cost: Free API access
   - Setup: Whitelist server IP

2. **Vercel** - Already integrated
   - Using: Existing token

3. **Stripe** - Already integrated
   - Using: Existing account

4. **AWS KMS** - Credential encryption
   - Need: AWS account (may already have)
   - Cost: ~$1/month

5. **DNS Checker** - Use free public APIs
   - Google DNS: 8.8.8.8
   - Cloudflare: 1.1.1.1

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Core infrastructure and database

- [ ] Create Prisma schema (LaunchWorkflow, DomainRegistration, etc.)
- [ ] Run migrations
- [ ] Setup LangGraph workflow structure
- [ ] Create base agent classes
- [ ] Implement state management
- [ ] Basic error handling framework

**Deliverable:** Empty workflow that can be triggered and tracked

---

### Phase 2: Domain Search (Week 2)
**Goal:** Working domain search

- [ ] Integrate Namecheap domain check API
- [ ] Build DomainSearchAgent
- [ ] Implement caching layer
- [ ] Test with various domain names
- [ ] Handle rate limiting

**Deliverable:** Can search and report domain availability

---

### Phase 3: Payment & Purchase (Week 3)
**Goal:** Complete domain purchase flow

- [ ] Stripe payment integration for domain
- [ ] Namecheap domain purchase API
- [ ] WHOIS privacy automation
- [ ] Refund automation
- [ ] Test in sandbox environment

**Deliverable:** Can purchase domain (sandbox)

---

### Phase 4: DNS Configuration (Week 3-4)
**Goal:** Automated DNS setup

- [ ] Namecheap DNS API integration
- [ ] Add Vercel A/CNAME records
- [ ] DNS propagation monitoring
- [ ] Test with real domain (QA)

**Deliverable:** DNS auto-configured

---

### Phase 5: Vercel Integration (Week 4)
**Goal:** Connect domain to Vercel

- [ ] Vercel domain addition API
- [ ] SSL certificate monitoring
- [ ] Domain verification
- [ ] Deployment testing

**Deliverable:** Domain connected to Vercel with SSL

---

### Phase 6: Verification & Testing (Week 5)
**Goal:** Comprehensive verification

- [ ] Build LaunchVerificationAgent
- [ ] DNS verification
- [ ] HTTP/HTTPS testing
- [ ] SSL validation
- [ ] Page load tests
- [ ] Optional: Lighthouse integration

**Deliverable:** Full site verification

---

### Phase 7: UI/UX (Week 5-6)
**Goal:** Beautiful user interface

- [ ] Create /launch page
- [ ] Domain search form
- [ ] Payment UI (Stripe Elements)
- [ ] Real-time progress display
- [ ] Success/error states
- [ ] Launch report page

**Deliverable:** Complete user-facing interface

---

### Phase 8: Production Launch (Week 6-7)
**Goal:** Live with real domains

- [ ] Namecheap production API
- [ ] AWS KMS for credential encryption
- [ ] Error monitoring (Sentry)
- [ ] Load testing
- [ ] Documentation
- [ ] Launch to beta users

**Deliverable:** Live system with real domain purchases

---

## Testing Strategy

### Unit Tests

```typescript
// agents/domain-search-agent.test.ts
describe('DomainSearchAgent', () => {
  it('should find available domain', async () => {
    const result = await domainSearchAgent.execute({
      domain: 'definitely-not-taken-12345.com',
      registrar: 'namecheap',
    });

    expect(result.available).toBe(true);
    expect(result.pricing).toBeDefined();
  });

  it('should handle taken domain', async () => {
    const result = await domainSearchAgent.execute({
      domain: 'google.com',
      registrar: 'namecheap',
    });

    expect(result.available).toBe(false);
  });

  it('should suggest alternatives', async () => {
    const result = await domainSearchAgent.execute({
      domain: 'google.com',
      registrar: 'namecheap',
      checkAlternatives: true,
    });

    expect(result.alternatives).toBeDefined();
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
describe('Launch Workflow - End to End', () => {
  it('should complete full launch in sandbox', async () => {
    const workflow = await createLaunchWorkflow({
      userId: testUser.id,
      projectId: testProject.id,
      domain: `test-${Date.now()}.com`,
      registrar: 'namecheap',
    });

    const result = await executeWorkflow(workflow.id);

    expect(result.success).toBe(true);
    expect(result.liveUrl).toBe(`https://test-${Date.now()}.com`);

    // Verify domain was purchased
    const registration = await getDomainRegistration(workflow.id);
    expect(registration).toBeDefined();
    expect(registration.domain).toBe(workflow.desiredDomain);

    // Verify DNS is configured
    const dns = await checkDNS(workflow.desiredDomain);
    expect(dns.aRecord).toBe('76.76.21.21');

    // Cleanup
    await rollbackWorkflow(workflow.id);
  });
});
```

### Manual Testing Checklist

- [ ] Search for available domain
- [ ] Search for taken domain
- [ ] Purchase domain (sandbox)
- [ ] Verify WHOIS privacy enabled
- [ ] Check DNS records configured
- [ ] Verify Vercel domain added
- [ ] Check SSL certificate issued
- [ ] Test https://domain.com loads
- [ ] Test https://www.domain.com redirects
- [ ] Test http→https redirect
- [ ] Verify Google Analytics added
- [ ] Check launch report accuracy

### Load Testing

**Scenario:** 10 concurrent launches
```bash
artillery run launch-load-test.yml
```

**Expected:**
- All launches complete successfully
- Average completion time < 15 minutes
- No database deadlocks
- No API rate limit errors

---

## Deployment & Monitoring

### Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing
- [ ] Environment variables set
- [ ] AWS KMS configured
- [ ] Namecheap API whitelisted
- [ ] Database migrations run

**Deployment:**
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error rates

**Post-deployment:**
- [ ] Test with real domain (company domain)
- [ ] Monitor first 10 customer launches
- [ ] Collect user feedback

### Monitoring

**Key Metrics:**

1. **Success Rate**
   - Target: > 95%
   - Alert if < 90% over 1 hour

2. **Launch Time**
   - Target: < 15 minutes (p95)
   - Alert if > 20 minutes (p95)

3. **Error Rate by Step**
   - Track errors per agent
   - Alert on unusual spikes

4. **Cost per Launch**
   - Track API costs
   - Alert if > $10 per launch

**Alerting:**
```typescript
// Datadog / Sentry
if (errorRate > 0.1 && lastHour) {
  alert('engineering', {
    severity: 'high',
    message: 'Launch agent error rate exceeds 10%',
    metric: errorRate,
  });
}

if (avgLaunchTime > 20 * 60 * 1000) {
  alert('engineering', {
    severity: 'medium',
    message: 'Launch times degraded',
    metric: avgLaunchTime,
  });
}
```

---

## Edge Cases & Failure Modes

### Edge Case Matrix

| Scenario | Probability | Impact | Mitigation |
|----------|------------|--------|------------|
| Domain taken between search and purchase | Low | Medium | Suggest alternatives immediately |
| Payment succeeds, domain purchase fails | Very Low | High | Auto-refund + manual resolution |
| DNS propagation timeout (>30min) | Medium | Low | Continue monitoring in background |
| Vercel API down | Low | High | Queue requests, retry when available |
| SSL cert provisioning fails | Low | Medium | Retry, escalate if persists |
| User cancels mid-purchase | Medium | Medium | Graceful cancellation, refund if needed |
| Invalid domain format | Medium | Low | Validate before search |
| Domain price changed | Low | Medium | Show updated price, require confirmation |
| Registrar rate limit | Medium | Low | Exponential backoff, queue |

### Failure Mode Analysis

**1. Payment Succeeds → Domain Purchase Fails**

**Probability:** < 0.1%

**Impact:** Critical (user charged but no domain)

**Detection:**
- Monitor for charges without corresponding registrar order ID
- Alert if detected within 5 minutes

**Resolution:**
1. Automatic refund initiated
2. Engineering team alerted (high priority)
3. Manual attempt to purchase domain
4. If still fails, refund confirmed + user notified + apology credit

**Prevention:**
- Use Stripe payment authorization (not capture) until domain confirmed
- Capture payment only after domain purchase succeeds

---

**2. DNS Propagation Timeout**

**Probability:** ~5%

**Impact:** Low (just delays completion)

**Detection:**
- DNS not propagated after 30 minutes

**Resolution:**
1. Continue monitoring in background (up to 24 hours)
2. Notify user: "Your domain is configured but DNS is still propagating. We'll email you when it's live."
3. Email notification when DNS finally propagates
4. If still not propagated after 24 hours → alert engineering

**Prevention:**
- Use lower TTL values (300s instead of 3600s)
- Verify DNS records were actually added before starting propagation wait

---

**3. Concurrent Domain Purchases (Race Condition)**

**Probability:** < 1%

**Impact:** Medium (duplicate charges possible)

**Detection:**
- Check for duplicate domain purchases in database

**Resolution:**
1. Database unique constraint on domain
2. If duplicate detected after payment, refund 2nd purchase
3. Notify user of race condition

**Prevention:**
- Distributed lock on domain during purchase
- Re-check availability immediately before purchase API call

---

## Next Steps

### Decision Points

Before implementation, decide on:

1. **Registrar Strategy**
   - Start with Namecheap only? ✅ (Recommended)
   - Or support multiple registrars from day 1?

2. **Pricing Model**
   - $99 add-on? ✅
   - Bundled in Turnkey ($497)? ✅
   - Both? ✅ (Recommended)

3. **Payment Flow**
   - Charge upfront (domain + setup fee)? ✅ (Simpler)
   - Or separate charges (domain, then setup)?

4. **DNS Wait Time**
   - Block until DNS propagates (slow)? ❌
   - Or continue in background (better UX)? ✅ (Recommended)

5. **Analytics Integration**
   - Fully automated Google Analytics? (Complex OAuth)
   - Or manual setup with provided instructions? ✅ (MVP)

### Questions to Answer

1. Do we have a Namecheap production API account?
2. What's our target launch date?
3. Who will QA test this?
4. What's the beta user list?
5. How many concurrent launches should we support initially?

---

## Conclusion

This architecture provides:

✅ **Fully automated domain-to-deployment**
✅ **15-minute average launch time**
✅ **95%+ success rate**
✅ **$95 profit per $99 launch**
✅ **Massive competitive moat**
✅ **Scalable to 1000s of launches**

**Total Development Time:** 6-7 weeks
**Team Size:** 1-2 engineers
**Risk:** Low-Medium (APIs are stable)
**ROI:** Very High

---

**Ready to build?** Let's start with Phase 1 and get the foundation in place.


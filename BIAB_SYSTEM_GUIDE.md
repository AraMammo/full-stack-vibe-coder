# Business in a Box (BIAB) System - Complete Guide

## Overview

The BIAB system transforms voice transcripts into complete startup packages by executing 16 AI-powered prompts covering:
- Business Model & Market Research
- Branding & Visual Identity
- Product & Service Development
- Operations & Team Building
- Go-To-Market Strategy & Growth
- Financial Planning & Projections
- Legal & Compliance
- Tech & Automation Setup
- Investor Pitch & Funding Strategy
- Launch Tools

---

## System Architecture

### 1. Database Models

#### PromptTemplate
Stores the 16 pre-configured BIAB prompts.

```prisma
model PromptTemplate {
  id              Int      @id @default(autoincrement())
  promptId        String   @unique
  promptName      String
  promptSection   String
  systemPrompt    String   @db.Text
  userPrompt      String   @db.Text
  isRequired      Boolean  @default(true)
  orderIndex      Int
  estimatedTokens Int
  dependencies    String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  executions      PromptExecution[]
}
```

**Seeded Prompts** (16 total):
1. business_model_01 - Business Model Breakdown
2. competitive_analysis_02 - Competitive Analysis & Market Gaps
3. target_audience_03 - Target Audience & Pain Points
4. brand_positioning_04 - Brand Strategy & Positioning
5. visual_identity_05 - Logo & Visual Identity
6. mvp_definition_06 - MVP Definition & Product Roadmap
7. pricing_strategy_07 - Product Pricing Strategy
8. hiring_plan_08 - Hiring Plan & Key Roles
9. gtm_launch_plan_09 - Go-To-Market Launch Plan
10. customer_acquisition_10 - Customer Acquisition Strategy
11. social_content_11 - Social Media Content Strategy
12. financial_forecast_12 - Revenue & Profitability Forecast
13. legal_compliance_13 - Legal & Compliance Checklist
14. tech_stack_14 - Tech Stack Recommendations
15. pitch_deck_15 - Startup Pitch Deck Outline
16. replit_site_16 - Website Builder AI Prompt

#### PromptExecution
Stores the result of each prompt execution.

```prisma
model PromptExecution {
  id              Int      @id @default(autoincrement())
  promptId        Int
  prompt          PromptTemplate @relation(...)
  projectId       String
  input           String   @db.Text
  output          String   @db.Text
  tokensUsed      Int
  executionTimeMs Int?
  executedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
}
```

#### DeliveryPackage
Stores downloadable ZIP packages of deliverables.

```prisma
model DeliveryPackage {
  id          Int      @id @default(autoincrement())
  packageId   String   @unique
  projectId   String
  userId      String
  downloadUrl String
  storagePath String
  fileSize    Int
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}
```

---

### 2. Core Components

#### BIAB Orchestrator Agent
**File**: `lib/agents/biab-orchestrator-agent.ts`

**Responsibilities**:
- Load all 16 PromptTemplate records ordered by `orderIndex`
- Execute prompts sequentially with dependency resolution
- Inject `{{business_concept}}` placeholder with voice transcript
- Pass outputs from dependencies to dependent prompts
- Save each result as PromptExecution record
- Track tokens, execution time, and section breakdown

**Key Methods**:
- `execute(input)` - Main execution flow
- `resolvePromptInput()` - Handles dependency injection
- `executePrompt()` - Calls Claude API
- `getExecutionSummary()` - Retrieves project execution stats

**Example Usage**:
```typescript
import { BIABOrchestratorAgent } from '@/lib/agents/biab-orchestrator-agent';

const orchestrator = new BIABOrchestratorAgent();
const result = await orchestrator.execute({
  projectId: 'proj_123',
  businessConcept: 'A SaaS platform for...',
  userId: 'user_456',
});
```

#### Delivery Packaging System
**File**: `lib/delivery/package-biab-deliverables.ts`

**Responsibilities**:
- Query all PromptExecution records for a project
- Organize outputs by `promptSection` into folders
- Generate markdown files for each output
- Create ZIP file with folder structure
- Upload to Supabase Storage
- Generate signed download URL (7-day expiration)
- Save DeliveryPackage record

**Folder Structure**:
```
business-in-a-box/
├── README.md
├── business-model-and-market-research/
│   ├── 1-business-model-breakdown.md
│   ├── 2-competitive-analysis-market-gaps.md
│   └── 3-target-audience-pain-points.md
├── branding-and-visual-identity/
│   ├── 4-brand-strategy-positioning.md
│   └── 5-logo-visual-identity.md
├── product-and-service-development/
│   ├── 6-mvp-definition-product-roadmap.md
│   └── 7-product-pricing-strategy.md
├── operations-and-team-building/
│   ├── 8-hiring-plan-key-roles.md
│   └── 9-go-to-market-launch-plan.md
├── go-to-market-strategy-and-growth/
│   ├── 10-customer-acquisition-strategy.md
│   └── 11-social-media-content-strategy.md
├── financial-planning-and-projections/
│   └── 12-revenue-profitability-forecast.md
├── legal-and-compliance/
│   └── 13-legal-compliance-checklist.md
├── tech-and-automation-setup/
│   └── 14-tech-stack-recommendations.md
├── investor-pitch-and-funding-strategy/
│   └── 15-startup-pitch-deck-outline.md
└── launch-tools/
    └── 16-website-builder-ai-prompt.md
```

**Key Functions**:
- `packageBIABDeliverables(projectId, userId)` - Main packaging function
- `getDeliveryPackage(packageId)` - Retrieve package record
- `regeneratePackageURL(packageId)` - Renew expired download links

---

### 3. API Endpoints

#### POST /api/business-in-a-box/execute
Triggers BIAB orchestrator execution.

**Request**:
```json
{
  "projectId": "proj_123",
  "businessConcept": "Voice transcript or business description",
  "userId": "user_456"
}
```

**Response**:
```json
{
  "success": true,
  "projectId": "proj_123",
  "summary": {
    "totalPrompts": 16,
    "completedPrompts": 16,
    "totalTokensUsed": 45000,
    "totalExecutionTimeMs": 120000,
    "bySection": {
      "Business Model & Market Research": 3,
      "Branding & Visual Identity": 2,
      ...
    }
  },
  "executionIds": [1, 2, 3, ...]
}
```

#### GET /api/business-in-a-box/execute?projectId=proj_123
Get execution summary for a project.

**Response**:
```json
{
  "success": true,
  "projectId": "proj_123",
  "summary": {
    "totalExecutions": 16,
    "totalTokens": 45000,
    "bySection": {...},
    "executions": [...]
  }
}
```

#### POST /api/project/[id]/package-delivery
Creates downloadable ZIP package.

**Request**:
```json
{
  "userId": "user_456"
}
```

**Response**:
```json
{
  "success": true,
  "packageId": "pkg_uuid",
  "downloadUrl": "https://supabase.storage.../signed-url",
  "expiresAt": "2025-10-28T...",
  "fileSize": 2048000
}
```

#### GET /api/delivery/[packageId]/download
Redirects to download URL.

**Behavior**:
- Returns 404 if package not found
- Returns 410 if expired (tries to regenerate)
- Returns 302 redirect to signed URL

---

## Complete Workflow

### Step 1: Voice Transcript → Execution

```typescript
// 1. User uploads voice note
const voiceFile = await uploadVoiceNote(userId, file, 'business-idea.webm');

// 2. Transcribe with Whisper/AssemblyAI
const transcript = await transcribeVoiceNote(voiceFile.path);

// 3. Execute BIAB orchestrator
const response = await fetch('/api/business-in-a-box/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'new-project-id',
    businessConcept: transcript,
    userId: currentUser.id,
  }),
});

const result = await response.json();
// Result contains execution summary and IDs
```

### Step 2: Package → Download

```typescript
// 4. Package deliverables
const pkgResponse = await fetch(`/api/project/${projectId}/package-delivery`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: currentUser.id }),
});

const packageData = await pkgResponse.json();

// 5. Send download link to user
await sendEmail({
  to: user.email,
  subject: 'Your Business in a Box is Ready!',
  body: `Download your startup package: ${packageData.downloadUrl}`,
});
```

### Step 3: User Downloads

```
User clicks: https://yoursite.com/api/delivery/pkg_uuid/download
→ API checks expiration
→ Redirects to Supabase signed URL
→ ZIP file downloads (business-in-a-box.zip)
```

---

## Dependency Resolution Example

**Prompt 4: brand_positioning_04** depends on:
- `target_audience_03`
- `competitive_analysis_02`

**Input Construction**:
```markdown
Create brand positioning for: {{business_concept}}. Include positioning statement...

# Context from Previous Analyses

## Target Audience & Pain Points

[Output from prompt 3]

---

## Competitive Analysis & Market Gaps

[Output from prompt 2]

---
```

The orchestrator automatically injects dependency outputs into the prompt context.

---

## Token Usage & Costs

**Estimated Tokens per Execution**:
- Total: ~45,000 - 50,000 tokens
- Input: ~15,000 tokens (prompts + dependencies)
- Output: ~35,000 tokens (16 detailed responses)

**Cost Estimate** (Claude Sonnet 4.5):
- ~$0.50 - $0.75 per full BIAB execution

**Execution Time**:
- Sequential: ~2-3 minutes for all 16 prompts
- Depends on API latency and token count

---

## Testing

### Seed Database
```bash
npx tsx prisma/seed-biab-prompts.ts
```

### Test Orchestrator
```typescript
import { BIABOrchestratorAgent } from '@/lib/agents/biab-orchestrator-agent';

async function testBIAB() {
  const orchestrator = new BIABOrchestratorAgent();

  const result = await orchestrator.execute({
    projectId: 'test-project-001',
    businessConcept: 'A mobile app that helps freelancers track time and send invoices automatically.',
    userId: 'test-user-123',
  });

  console.log('Execution Result:', result);

  if (result.success) {
    const summary = await orchestrator.getExecutionSummary('test-project-001');
    console.log('Summary:', summary);
  }
}

testBIAB();
```

### Test Packaging
```typescript
import { packageBIABDeliverables } from '@/lib/delivery/package-biab-deliverables';

async function testPackaging() {
  const result = await packageBIABDeliverables('test-project-001', 'test-user-123');

  console.log('Package Result:', result);
  console.log('Download URL:', result.downloadUrl);
}

testPackaging();
```

---

## Error Handling

### Orchestrator
- **Failed Prompts**: Logged but non-blocking (continues to next prompt)
- **API Errors**: Saved as error output in PromptExecution
- **Dependency Missing**: Continues with available context

### Packaging
- **No Executions**: Returns error
- **Upload Failed**: Returns storage error
- **Expired Package**: Auto-regenerates signed URL

---

## Performance Optimizations

### Future Enhancements
1. **Parallel Execution**: Execute independent prompts in parallel
2. **Caching**: Cache dependency outputs to reduce context size
3. **Streaming**: Stream prompt outputs for real-time feedback
4. **Incremental Packaging**: Package sections as they complete
5. **Background Jobs**: Use queue system (Bull, BullMQ) for long executions

---

## Storage Configuration

Ensure Supabase storage bucket exists:

```typescript
import { STORAGE_BUCKETS, initializeStorageBuckets } from '@/lib/storage';

// Run once during setup
await initializeStorageBuckets();
```

**Bucket**: `deliverables`
- Private (requires signed URLs)
- 50MB file size limit
- 7-day signed URL expiration

---

## Monitoring & Analytics

### Track Metrics
```typescript
// In PromptExecution model
- tokensUsed (per prompt)
- executionTimeMs (per prompt)
- executedAt (timestamp)

// In DeliveryPackage model
- fileSize (package size in bytes)
- createdAt (generation time)
- expiresAt (expiration tracking)
```

### Query Analytics
```typescript
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Total tokens used across all executions
const totalTokens = await prisma.promptExecution.aggregate({
  _sum: { tokensUsed: true },
});

// Average execution time per prompt
const avgTime = await prisma.promptExecution.aggregate({
  _avg: { executionTimeMs: true },
});

// Executions by section
const bySection = await prisma.promptExecution.groupBy({
  by: ['prompt'],
  _count: { id: true },
});
```

---

## Environment Variables Required

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Files Created

### Database
- `prisma/schema.prisma` - Updated with PromptExecution, DeliveryPackage models

### Agents
- `lib/agents/biab-orchestrator-agent.ts` - BIAB orchestrator

### Delivery
- `lib/delivery/package-biab-deliverables.ts` - ZIP packaging system

### API Routes
- `app/api/business-in-a-box/execute/route.ts` - Execute orchestrator
- `app/api/project/[id]/package-delivery/route.ts` - Package deliverables
- `app/api/delivery/[packageId]/download/route.ts` - Download package

### Documentation
- `BIAB_SYSTEM_GUIDE.md` - This file

---

## Next Steps

1. **Seed Prompts** (if not done):
   ```bash
   npx tsx prisma/seed-biab-prompts.ts
   ```

2. **Test Execution**:
   ```bash
   curl -X POST http://localhost:3000/api/business-in-a-box/execute \
     -H "Content-Type: application/json" \
     -d '{"projectId":"test-001","businessConcept":"A SaaS for...","userId":"user-123"}'
   ```

3. **Test Packaging**:
   ```bash
   curl -X POST http://localhost:3000/api/project/test-001/package-delivery \
     -H "Content-Type: application/json" \
     -d '{"userId":"user-123"}'
   ```

4. **Integrate with Voice Upload**:
   - Connect voice transcription → BIAB execution
   - Add UI for tracking execution progress
   - Send email with download link when complete

---

## Support

For issues or questions:
- GitHub: [Your Repo]
- Email: support@fullstackvibecoder.com

---

*Built with Claude Sonnet 4.5 & FullStackVibeCoder*

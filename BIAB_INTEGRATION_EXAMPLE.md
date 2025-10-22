# BIAB System - Integration Examples

## Frontend Integration

### 1. Execute BIAB from Voice Transcript

```typescript
// app/components/VoiceUploadFlow.tsx

'use client';

import { useState } from 'react';

export default function VoiceUploadFlow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleVoiceSubmit = async (voiceFile: File) => {
    setIsProcessing(true);

    try {
      // Step 1: Upload voice note to storage
      setProgress('Uploading voice note...');
      const uploadResponse = await fetch('/api/upload-voice', {
        method: 'POST',
        body: createFormData(voiceFile),
      });
      const { voicePath } = await uploadResponse.json();

      // Step 2: Transcribe voice note
      setProgress('Transcribing voice note...');
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voicePath }),
      });
      const { transcript } = await transcribeResponse.json();

      // Step 3: Create project
      const projectId = `proj_${Date.now()}`;

      // Step 4: Execute BIAB
      setProgress('Generating your startup package (this may take 2-3 minutes)...');
      const biabResponse = await fetch('/api/business-in-a-box/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          businessConcept: transcript,
          userId: 'current-user-id', // Get from session
        }),
      });

      const biabResult = await biabResponse.json();

      if (!biabResult.success) {
        throw new Error(biabResult.error || 'BIAB execution failed');
      }

      console.log('BIAB completed:', biabResult.summary);

      // Step 5: Package deliverables
      setProgress('Creating your download package...');
      const packageResponse = await fetch(`/api/project/${projectId}/package-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'current-user-id' }),
      });

      const packageResult = await packageResponse.json();

      if (!packageResult.success) {
        throw new Error(packageResult.error || 'Packaging failed');
      }

      // Step 6: Show download link
      setDownloadUrl(packageResult.downloadUrl);
      setProgress('Complete! Your startup package is ready.');

      // Step 7: Send email notification
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'user@example.com',
          subject: 'Your Business in a Box is Ready!',
          downloadUrl: packageResult.downloadUrl,
          expiresAt: packageResult.expiresAt,
        }),
      });

    } catch (error) {
      console.error('Error:', error);
      setProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h1>Generate Your Business in a Box</h1>

      {isProcessing && (
        <div className="progress-indicator">
          <p>{progress}</p>
          <div className="spinner" />
        </div>
      )}

      {downloadUrl && (
        <div className="download-section">
          <h2>✅ Your Startup Package is Ready!</h2>
          <a href={downloadUrl} download className="download-button">
            Download Business in a Box (ZIP)
          </a>
          <p className="expiry-note">
            Download link expires in 7 days. Check your email for a copy.
          </p>
        </div>
      )}

      {/* Voice upload UI */}
      {!isProcessing && !downloadUrl && (
        <VoiceRecorder onSubmit={handleVoiceSubmit} />
      )}
    </div>
  );
}

function createFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}
```

---

## 2. Track Execution Progress (Real-time)

```typescript
// app/hooks/useBIABProgress.ts

import { useState, useEffect } from 'react';

interface ExecutionProgress {
  totalPrompts: number;
  completedPrompts: number;
  currentSection: string;
  isComplete: boolean;
}

export function useBIABProgress(projectId: string | null) {
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const pollProgress = async () => {
      const response = await fetch(
        `/api/business-in-a-box/execute?projectId=${projectId}`
      );
      const data = await response.json();

      if (data.success) {
        setProgress({
          totalPrompts: data.summary.totalExecutions || 16,
          completedPrompts: data.summary.totalExecutions || 0,
          currentSection: data.summary.executions?.[data.summary.executions.length - 1]?.promptSection || '',
          isComplete: data.summary.totalExecutions === 16,
        });
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollProgress, 5000);
    pollProgress(); // Initial call

    return () => clearInterval(interval);
  }, [projectId]);

  return progress;
}

// Usage in component
export function BIABProgressTracker({ projectId }: { projectId: string }) {
  const progress = useBIABProgress(projectId);

  if (!progress) return <div>Loading...</div>;

  const percentage = (progress.completedPrompts / progress.totalPrompts) * 100;

  return (
    <div className="progress-tracker">
      <h3>Generating Your Startup Package</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p>
        {progress.completedPrompts} of {progress.totalPrompts} completed
      </p>
      <p className="current-section">
        Current: {progress.currentSection}
      </p>
    </div>
  );
}
```

---

## 3. Server-Side Usage (API Route)

```typescript
// app/api/workflow/biab-complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { BIABOrchestratorAgent } from '@/lib/agents/biab-orchestrator-agent';
import { packageBIABDeliverables } from '@/lib/delivery/package-biab-deliverables';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { projectId, businessConcept, userId, userEmail } = await request.json();

  try {
    // Execute BIAB
    const orchestrator = new BIABOrchestratorAgent();
    const executionResult = await orchestrator.execute({
      projectId,
      businessConcept,
      userId,
    });

    if (!executionResult.success) {
      return NextResponse.json(
        { success: false, error: executionResult.error },
        { status: 500 }
      );
    }

    // Package deliverables
    const packageResult = await packageBIABDeliverables(projectId, userId);

    if (!packageResult.success) {
      return NextResponse.json(
        { success: false, error: packageResult.error },
        { status: 500 }
      );
    }

    // Send email with download link
    await sendEmail({
      to: userEmail,
      subject: '🎉 Your Business in a Box is Ready!',
      html: `
        <h1>Your Startup Package is Complete</h1>
        <p>We've generated a complete startup toolkit based on your business idea.</p>
        <p>
          <a href="${packageResult.downloadUrl}" style="background: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Download Your Business in a Box
          </a>
        </p>
        <p><strong>What's inside:</strong></p>
        <ul>
          <li>Business Model Breakdown</li>
          <li>Competitive Analysis</li>
          <li>Brand Strategy & Visual Identity</li>
          <li>MVP Roadmap & Pricing Strategy</li>
          <li>Go-To-Market Plan</li>
          <li>Financial Forecast</li>
          <li>Legal Checklist</li>
          <li>Tech Stack Recommendations</li>
          <li>Pitch Deck Outline</li>
          <li>...and 7 more documents!</li>
        </ul>
        <p><em>Download link expires in 7 days.</em></p>
      `,
    });

    return NextResponse.json({
      success: true,
      packageId: packageResult.packageId,
      downloadUrl: packageResult.downloadUrl,
      summary: executionResult.executionsSummary,
    });

  } catch (error) {
    console.error('BIAB workflow error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## 4. Background Job (Queue System)

For production, use a queue system like BullMQ:

```typescript
// lib/jobs/biab-job.ts

import { Queue, Worker } from 'bullmq';
import { BIABOrchestratorAgent } from '@/lib/agents/biab-orchestrator-agent';
import { packageBIABDeliverables } from '@/lib/delivery/package-biab-deliverables';
import { sendEmail } from '@/lib/email';

// Create queue
export const biabQueue = new Queue('biab-execution', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Create worker
const biabWorker = new Worker(
  'biab-execution',
  async (job) => {
    const { projectId, businessConcept, userId, userEmail } = job.data;

    // Update progress: Starting
    await job.updateProgress({ step: 'executing', progress: 0 });

    // Execute BIAB
    const orchestrator = new BIABOrchestratorAgent();
    const executionResult = await orchestrator.execute({
      projectId,
      businessConcept,
      userId,
    });

    if (!executionResult.success) {
      throw new Error(executionResult.error);
    }

    // Update progress: Packaging
    await job.updateProgress({ step: 'packaging', progress: 80 });

    // Package deliverables
    const packageResult = await packageBIABDeliverables(projectId, userId);

    if (!packageResult.success) {
      throw new Error(packageResult.error);
    }

    // Update progress: Sending email
    await job.updateProgress({ step: 'notifying', progress: 95 });

    // Send email
    await sendEmail({
      to: userEmail,
      subject: 'Your Business in a Box is Ready!',
      downloadUrl: packageResult.downloadUrl,
    });

    // Complete
    await job.updateProgress({ step: 'complete', progress: 100 });

    return {
      packageId: packageResult.packageId,
      downloadUrl: packageResult.downloadUrl,
    };
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
);

// Add job to queue
export async function enqueueBIABJob(data: {
  projectId: string;
  businessConcept: string;
  userId: string;
  userEmail: string;
}) {
  const job = await biabQueue.add('biab-execution', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return job;
}

// Get job status
export async function getBIABJobStatus(jobId: string) {
  const job = await biabQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  };
}
```

Usage:
```typescript
// In API route
const job = await enqueueBIABJob({
  projectId: 'proj_123',
  businessConcept: transcript,
  userId: 'user_456',
  userEmail: 'user@example.com',
});

return NextResponse.json({
  success: true,
  jobId: job.id,
  message: 'BIAB execution started in background',
});
```

---

## 5. Webhook Integration

Trigger BIAB from external services (Zapier, Make.com):

```typescript
// app/api/webhooks/biab/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { enqueueBIABJob } from '@/lib/jobs/biab-job';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const signature = request.headers.get('x-webhook-signature');
  const body = await request.text();

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Parse request
  const data = JSON.parse(body);

  // Enqueue BIAB job
  const job = await enqueueBIABJob({
    projectId: data.projectId || `proj_${Date.now()}`,
    businessConcept: data.businessConcept,
    userId: data.userId,
    userEmail: data.userEmail,
  });

  return NextResponse.json({
    success: true,
    jobId: job.id,
    message: 'BIAB execution queued',
  });
}
```

---

## 6. Testing Script

```bash
# Test BIAB execution
curl -X POST http://localhost:3000/api/business-in-a-box/execute \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-001",
    "businessConcept": "A SaaS platform for managing freelance projects and invoicing",
    "userId": "test-user-123"
  }'

# Get execution summary
curl http://localhost:3000/api/business-in-a-box/execute?projectId=test-001

# Package deliverables
curl -X POST http://localhost:3000/api/project/test-001/package-delivery \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'

# Download package (replace with actual packageId)
curl -L http://localhost:3000/api/delivery/pkg_uuid/download -o biab.zip
```

---

## Environment Setup

```env
# .env.local

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Redis (for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379

# Webhooks
WEBHOOK_SECRET=your-webhook-secret

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx
SMTP_FROM=noreply@yourapp.com
```

---

## Cost Estimation

**Per BIAB Execution**:
- Tokens: ~45,000 - 50,000
- Cost (Claude Sonnet 4.5): ~$0.50 - $0.75
- Execution time: 2-3 minutes

**Pricing Strategy**:
- One-time: $49 - $99 per package
- Subscription: $19/month (3 executions/month)
- Enterprise: Custom pricing

---

## Performance Tips

1. **Cache Prompts**: Load PromptTemplate records once, cache in memory
2. **Parallel Dependencies**: Execute independent prompts in parallel
3. **Stream Responses**: Use streaming for real-time progress
4. **Background Jobs**: Always use queue for production
5. **Rate Limiting**: Add rate limits per user to prevent abuse

---

*For full documentation, see BIAB_SYSTEM_GUIDE.md*

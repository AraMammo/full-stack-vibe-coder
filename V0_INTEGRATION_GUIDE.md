# v0 Integration Guide

## Overview

The BIAB (Business In A Box) system now automatically deploys generated applications to Vercel v0, providing users with instant live previews of their custom web applications.

### What is v0?

v0 is Vercel's AI-powered code generation platform that creates production-ready Next.js/React applications from text prompts. It provides:
- Live preview and editing
- AI-powered code generation
- One-click deployment to Vercel
- Real-time collaboration

## Integration Architecture

### Flow Diagram

```
User Submits Business Concept
        ↓
BIAB Orchestrator Executes 16 Prompts
        ↓
Prompt 16: replit_site_16 (Website Builder AI Prompt)
        ↓
Extract & Format Prompt Output
        ↓
Send to v0.chats.create()
        ↓
v0 Generates Next.js Application
        ↓
Store URLs in Database
        ↓
Append URLs to Prompt Output
        ↓
Include in ZIP Package
        ↓
Return URLs in API Response
```

### Integration Points

1. **BIAB Orchestrator** (`lib/agents/biab-orchestrator-agent.ts`)
   - After `replit_site_16` execution completes
   - Calls `handleV0Deployment()` method
   - Only for LAUNCH_BLUEPRINT and TURNKEY_SYSTEM tiers

2. **v0 Client** (`lib/services/v0-client.ts`)
   - Wraps v0 SDK API calls
   - Handles authentication
   - Formats prompts for optimal v0 processing
   - Polls for completion status

3. **Database Schema** (`prisma/schema.prisma`)
   - `Project.v0ChatId` - v0 chat ID
   - `Project.v0PreviewUrl` - Preview/edit URL
   - `Project.v0DeployUrl` - Live demo URL (if deployed)
   - `Project.v0GeneratedAt` - Generation timestamp

4. **Delivery Packaging** (`lib/delivery/package-biab-deliverables.ts`)
   - Includes `v0-deployment/` folder in ZIP
   - Contains README with deployment instructions
   - Includes `DEPLOYMENT_URLS.txt` with quick access URLs

5. **API Response** (`app/api/business-in-a-box/execute/route.ts`)
   - Returns v0 deployment data in response
   - Includes status indicator

## Setup Instructions

### 1. Environment Variables

Add to `.env` file:

```env
# V0 (Vercel v0 AI Code Generation)
# Get your API key from: https://v0.dev/chat/settings/keys
V0_API_KEY="your-v0-api-key-here"
```

### 2. Get v0 API Key

1. Visit [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)
2. Create a new API key
3. Copy the key and add to `.env`

### 3. Database Migration

The v0 fields have been added to the `Project` model. If you need to reset the database:

```bash
npx prisma db push
```

This will add the following columns to the `projects` table:
- `v0ChatId` (String, optional)
- `v0PreviewUrl` (String, optional)
- `v0DeployUrl` (String, optional)
- `v0GeneratedAt` (DateTime, optional)

### 4. Install Dependencies

The v0 SDK is already installed:

```bash
npm install v0-sdk --legacy-peer-deps
```

## Technical Details

### v0 Client API

#### `generateV0App(options)`

Main function to generate an application from a prompt.

```typescript
import { generateV0App } from '@/lib/services/v0-client';

const result = await generateV0App({
  prompt: 'Create a Next.js landing page with hero section, features, and CTA',
  systemPrompt: 'You are an expert Next.js developer...', // Optional
  chatPrivacy: 'private', // 'public' | 'private' | 'team-edit' | 'team' | 'unlisted'
  projectId: 'optional-project-id', // Link to existing v0 project
  waitForCompletion: true, // Poll until generation completes (default: false)
});

if (result.success) {
  console.log('Chat ID:', result.chatId);
  console.log('Preview URL:', result.webUrl);
  console.log('Demo URL:', result.demoUrl); // If deployed
}
```

**Options:**
- `prompt` (required): The application description
- `systemPrompt` (optional): Custom system instructions for v0
- `chatPrivacy` (optional): Privacy setting for the chat
- `projectId` (optional): Existing v0 project to link to
- `waitForCompletion` (optional): If true, waits up to 60 seconds for generation

**Returns:**
```typescript
{
  success: boolean;
  chatId?: string;
  previewUrl?: string;  // Same as webUrl
  webUrl?: string;      // Preview/edit URL
  demoUrl?: string;     // Live demo URL (if deployed)
  projectId?: string;   // v0 project ID
  error?: string;
  metadata?: {
    createdAt?: string;
    privacy?: string;
    status?: string;    // 'pending' | 'completed' | 'failed'
  };
}
```

#### `formatReplitPromptForV0(promptOutput)`

Formats the replit_site_16 output for optimal v0 processing.

```typescript
import { formatReplitPromptForV0 } from '@/lib/services/v0-client';

const replitOutput = execution.output; // From replit_site_16
const formattedPrompt = formatReplitPromptForV0(replitOutput);
// Adds v0-specific context and removes markdown code blocks
```

#### `testV0Connection()`

Test v0 API connectivity.

```typescript
import { testV0Connection } from '@/lib/services/v0-client';

const isConnected = await testV0Connection();
if (isConnected) {
  console.log('v0 API is working!');
}
```

### BIAB Orchestrator Integration

The orchestrator automatically handles v0 deployment in `handleV0Deployment()`:

```typescript
private async handleV0Deployment(
  execution: any,
  promptId: string,
  tier: BIABTier,
  projectId: string
): Promise<void>
```

**Behavior:**
1. Only triggers for `replit_site_16` prompt
2. Only for `LAUNCH_BLUEPRINT` and `TURNKEY_SYSTEM` tiers
3. Formats the prompt output
4. Calls `generateV0App()` with `waitForCompletion: true`
5. Stores URLs in database
6. Appends deployment info to execution output
7. Handles errors gracefully (doesn't fail entire execution)

### Database Schema

```prisma
model Project {
  // ... existing fields ...

  // v0 Integration fields
  v0ChatId            String?       // v0 chat ID from deployment
  v0PreviewUrl        String?       // v0 preview/edit URL
  v0DeployUrl         String?       // v0 demo/live URL (if deployed)
  v0GeneratedAt       DateTime?     // When v0 generation completed

  @@index([v0ChatId])
}
```

### Delivery Package Structure

For LAUNCH_BLUEPRINT and TURNKEY_SYSTEM tiers, the ZIP includes:

```
biab-project-xyz.zip
├── README.md (includes v0 deployment info)
├── Business-Model-Market-Research/
├── Branding-Visual-Identity/
├── ...
├── Launch-Tools/
│   └── 16-website-builder-ai-prompt.md (includes v0 deployment section)
├── brand-assets/
│   └── logos/
├── v0-deployment/          ← NEW
│   ├── README.md           (Complete deployment guide)
│   └── DEPLOYMENT_URLS.txt (Quick access URLs)
└── handoff-documentation/ (TURNKEY only)
```

### API Response Format

```json
{
  "success": true,
  "projectId": "abc-123",
  "summary": {
    "totalPrompts": 16,
    "completedPrompts": 16,
    "totalTokensUsed": 45000,
    "totalExecutionTimeMs": 120000,
    "bySection": { ... }
  },
  "executionIds": [1, 2, 3, ...],
  "v0": {
    "chatId": "v0_chat_xyz",
    "previewUrl": "https://v0.dev/chat/xyz123",
    "deployUrl": "https://xyz123.vercel.app",
    "generatedAt": "2025-10-25T00:00:00Z",
    "status": "deployed"
  }
}
```

## User Experience

### Before Integration (Original Flow)

User receives:
1. ZIP package with 16 markdown documents
2. replit_site_16 contains a coding prompt
3. User must manually build the application

### After Integration (Enhanced Flow)

User receives:
1. ZIP package with 16 markdown documents
2. **Live preview URL** to see the application running
3. **v0 chat interface** to make refinements
4. **One-click deploy** option to publish to Vercel
5. Replit prompt as backup/customization option

### Example User Workflow

1. User submits business concept
2. BIAB executes 16 prompts (2-3 minutes)
3. System automatically deploys to v0 (30-60 seconds)
4. User receives email with:
   - Download link to ZIP
   - **Direct link to live preview**
   - **v0 chat URL for refinements**
5. User clicks preview URL
6. Sees application running immediately
7. Can request changes via v0 chat
8. Can deploy to production with one click

## Error Handling

### Graceful Degradation

If v0 deployment fails:
1. Error is logged but doesn't fail the entire execution
2. Prompt output includes error message
3. User still gets the replit prompt to build manually
4. ZIP package is still created and delivered

Example error message appended to prompt output:

```markdown
## v0 Deployment

⚠️ Automatic deployment to v0 failed: API authentication error

You can still use the Replit prompt above to build the application manually,
or deploy it to v0 yourself by visiting https://v0.dev and pasting the prompt.
```

### Common Errors

**V0_API_KEY not configured:**
```
Error: V0_API_KEY not configured in environment variables
```
Solution: Add V0_API_KEY to .env file

**Prompt too short:**
```
Error: Prompt must be at least 20 characters long
```
Solution: This shouldn't happen with replit_site_16, but indicates prompt extraction failed

**v0 API timeout:**
```
Error: Timeout after 20 attempts
```
Solution: Generation took too long, but chat was created. User can check v0ChatId in database.

## Testing

### Manual Test

1. Create a test project:

```typescript
import { generateV0App } from '@/lib/services/v0-client';

const result = await generateV0App({
  prompt: 'Create a simple landing page with a hero section and call-to-action button',
  waitForCompletion: true,
});

console.log(result);
```

2. Run the test script:

```bash
npx tsx -e "
import { testV0Connection } from './lib/services/v0-client';
testV0Connection().then(success => {
  console.log('v0 Connection:', success ? 'OK' : 'FAILED');
  process.exit(success ? 0 : 1);
});
"
```

### Integration Test

Run a full BIAB execution with LAUNCH_BLUEPRINT tier:

```bash
# Ensure V0_API_KEY is set in .env
# Run the existing BIAB test script
npx tsx scripts/test-biab-complete-flow.ts
```

Expected output should include:
```
[BIAB Orchestrator] 🚀 Deploying to v0...
[v0] Starting app generation...
[v0] Calling v0.chats.create()...
[v0] ✓ Chat created: v0_chat_xyz
[v0] Web URL: https://v0.dev/chat/xyz123
[v0] Waiting for generation to complete...
[v0] ✓ Generation completed!
[BIAB Orchestrator] ✓ v0 deployment successful
[BIAB Orchestrator] ✓ v0 URLs stored in Project table
```

## Monitoring & Logging

All v0 operations are logged with `[v0]` prefix:

```
[v0] Starting app generation...
[v0] Prompt length: 1523 characters
[v0] Privacy: private
[v0] Calling v0.chats.create()...
[v0] ✓ Chat created: v0_chat_abc123
[v0] Web URL: https://v0.dev/chat/abc123
[v0] ✓ Demo URL: https://abc123.vercel.app
[v0] Waiting for generation to complete...
[v0] Polling status (attempt 1/20)...
[v0] Status: pending
[v0] Still pending, waiting...
[v0] Polling status (attempt 2/20)...
[v0] Status: completed
[v0] ✓ Generation completed!
```

BIAB orchestrator logs with `[BIAB Orchestrator]` prefix:

```
[BIAB Orchestrator] 🚀 Deploying to v0...
[BIAB Orchestrator] Formatted prompt length: 1523 characters
[BIAB Orchestrator] ✓ v0 deployment successful
[BIAB Orchestrator]   Chat ID: v0_chat_abc123
[BIAB Orchestrator]   Web URL: https://v0.dev/chat/abc123
[BIAB Orchestrator] ✓ v0 URLs stored in Project table
[BIAB Orchestrator] ✓ v0 deployment info added to output
```

## Performance Considerations

### Timing

- **v0 API call**: 2-5 seconds
- **Generation (pending → completed)**: 20-60 seconds
- **Total overhead**: ~30-70 seconds per BIAB execution

### Token Usage

v0 generation does not consume BIAB token budget. It's a separate API call to v0.

### Rate Limits

v0 API has rate limits (check v0 documentation for current limits). If you hit rate limits:
- Error will be logged
- Execution continues without v0 deployment
- User still gets replit prompt

## Future Enhancements

Potential improvements to the v0 integration:

1. **Automatic Vercel Deployment**
   - Auto-deploy from v0 to Vercel production
   - Configure custom domains
   - Add to TURNKEY_SYSTEM tier

2. **User Control**
   - Add "deployToV0" flag in API request
   - Let users opt-out of v0 deployment
   - Choose between Replit prompt only or v0 deployment

3. **Project Linking**
   - Link multiple BIAB projects to same v0 project
   - Iterate on existing v0 projects
   - Version control for v0 deployments

4. **Enhanced Prompts**
   - Use brand strategy to customize v0 system prompts
   - Include logo URLs as attachments to v0
   - Pass color palette and typography to v0

5. **Deployment Tracking**
   - Track when users deploy from v0 to Vercel
   - Collect deployment URLs
   - Monitor application performance

## Troubleshooting

### v0 Deployment Not Working

1. **Check API Key**
   ```bash
   echo $V0_API_KEY
   # Should print your API key
   ```

2. **Test Connection**
   ```bash
   npx tsx -e "
   import { testV0Connection } from './lib/services/v0-client';
   testV0Connection();
   "
   ```

3. **Check Database Fields**
   ```sql
   SELECT v0ChatId, v0PreviewUrl, v0DeployUrl
   FROM projects
   WHERE id = 'your-project-id';
   ```

4. **Check Logs**
   Look for `[v0]` or `[BIAB Orchestrator]` prefixed messages in console

### v0 URLs Not in ZIP

1. Check if project has v0 data:
   ```typescript
   const project = await prisma.project.findUnique({
     where: { id: projectId },
   });
   console.log('v0 Data:', {
     chatId: project.v0ChatId,
     previewUrl: project.v0PreviewUrl,
     deployUrl: project.v0DeployUrl,
   });
   ```

2. Verify tier is LAUNCH_BLUEPRINT or TURNKEY_SYSTEM
3. Check packaging options include v0 data

### Generation Stuck in Pending

- v0 generation can take 30-60 seconds
- Check v0.dev/chat/[chatId] directly to see status
- The chat is created even if polling times out
- User can still access the chat via webUrl

## Support

For issues with:
- **v0 Integration**: Check this guide and logs
- **v0 API**: Contact Vercel support or check v0.dev/docs
- **BIAB System**: Contact FullStackVibeCoder support

## License

This integration follows the same license as the main project.

---

*Generated with FullStackVibeCoder - AI-Powered Startup Toolkit*

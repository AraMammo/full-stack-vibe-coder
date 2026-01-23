# Faceless Video Generator - Redesign Plan

## Overview

Redesign the Faceless Video Generator to integrate with the existing Airtable-based automation workflow. The tool should allow users to:

1. Input a source (text, URL, or audio)
2. Select a Story Type (style/template)
3. Submit and track progress
4. Download final video with captions

---

## Architecture

### Option A: Direct Airtable Integration (Recommended)

Connect directly to the existing Airtable base where automations are already built.

**Pros:**
- Automations already exist and work
- No need to rebuild complex workflows
- Leverage existing AI integrations (OpenAI, ElevenLabs, NCA Toolkit)

**Cons:**
- Dependent on Airtable infrastructure
- Need Airtable API credentials

### Option B: Replicate in Our Database

Build equivalent workflow using our Prisma database + API integrations.

**Pros:**
- Full control
- No external dependencies

**Cons:**
- Significant development effort
- Need to integrate: OpenAI, ElevenLabs, NCA Toolkit
- Complex state management for async operations

---

## Recommended Implementation (Option A)

### Environment Variables Needed

```env
# Faceless Video Airtable Base
FACELESS_VIDEO_AIRTABLE_BASE_ID=appr1TSJXvZsGk77W
FACELESS_VIDEO_AIRTABLE_PAT=pat...

# Table IDs
FACELESS_STORIES_TABLE_ID=tbl...
FACELESS_SCENES_TABLE_ID=tbl...
FACELESS_SHOTS_TABLE_ID=tbl...
FACELESS_STORY_TYPES_TABLE_ID=tbl...
```

### Database Tables (from Airtable CSVs)

#### Stories Table
| Field | Type | Description |
|-------|------|-------------|
| Story Name | Text | User-provided name |
| Source | Long Text | Input content (article, transcript) |
| Approve Source | Checkbox | Trigger to start processing |
| Story | Long Text | AI-generated story |
| Approve Story | Checkbox | Trigger scene generation |
| Story Status | Select | QUEUED, PROCESSING, COMPLETE, ERROR |
| # Scenes | Rollup | Count of linked scenes |
| # Shots | Rollup | Count of all shots |

#### Scenes Table
| Field | Type | Description |
|-------|------|-------------|
| Scene ID | Autonumber | Unique identifier |
| Scene Name | Text | Scene title/description |
| Story | Link | Parent story |
| Audio | Attachment | Generated voiceover |
| Video | Attachment | Combined shots video |
| Final Scene | Attachment | Mixed audio+video |
| Ready? | Formula | All shots complete |
| Sort | Number | Order in story |

#### Shots Table
| Field | Type | Description |
|-------|------|-------------|
| Shot Name | Text | Shot description |
| Scene | Link | Parent scene |
| Image | Attachment | AI-generated image |
| Audio | Attachment | Voiceover segment |
| Video | Attachment | Image-to-video output |
| Final Shot | Attachment | Mixed audio+video |
| Ready? | Formula | Processing complete |
| Sort | Number | Order in scene |

#### Story Types Table
| Field | Type | Description |
|-------|------|-------------|
| Story Type | Text | Name (e.g., "Comic Book News") |
| Image Action | Link | AI service for images |
| Audio Action | Link | AI service for audio |
| Video Action | Link | AI service for video |
| Captions | Checkbox | Add captions to final |

---

## New User Flow

### Step 1: Create Story
```
┌─────────────────────────────────────────────────────────┐
│  CREATE FACELESS VIDEO                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Story Name: [________________________]                 │
│                                                         │
│  Story Type: [▼ Comic Book News        ]               │
│              • Classic Dramatic Movie                   │
│              • Comic Book News                          │
│              • Faceless YouTube Video                   │
│                                                         │
│  Source Content:                                        │
│  ○ Paste Text   ○ Enter URL   ○ Upload Audio           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  Paste your article, script, or content here... │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│              [Create Story & Generate]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 2: Review & Approve (Optional)
```
┌─────────────────────────────────────────────────────────┐
│  STORY: "LA Robbery News Story"                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Status: ⏳ Generating Story...                         │
│                                                         │
│  Generated Story:                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ FBI and LAPD are investigating a major cash     │   │
│  │ heist in Los Angeles. Up to $30 million was...  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Scenes Preview:                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Scene 1  │ │ Scene 2  │ │ Scene 3  │               │
│  │ [image]  │ │ [image]  │ │ [image]  │               │
│  │ 3 shots  │ │ 4 shots  │ │ 3 shots  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│        [Edit]        [Approve & Continue]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Processing Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  VIDEO GENERATION IN PROGRESS                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Overall Progress: ████████░░░░░░░░░░░░░░ 42%          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✅ Story Generated                               │   │
│  │ ✅ Scenes Created (6 scenes)                     │   │
│  │ ✅ Shots Created (18 shots)                      │   │
│  │ ⏳ Generating Images... (12/18)                  │   │
│  │ ○ Generating Audio                               │   │
│  │ ○ Creating Videos                                │   │
│  │ ○ Building Final Shots                           │   │
│  │ ○ Combining Scenes                               │   │
│  │ ○ Adding Captions                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Estimated time: ~10 minutes                           │
│  Started: 2 minutes ago                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Download
```
┌─────────────────────────────────────────────────────────┐
│  VIDEO COMPLETE! 🎉                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │             [VIDEO PREVIEW]                      │   │
│  │                ▶️                                │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Duration: 2:45                                         │
│  Resolution: 1920x1080                                  │
│  File size: 48MB                                        │
│                                                         │
│       [Download MP4]    [Share]    [Create Another]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## API Routes

### POST /api/faceless-video/create-story
Creates a new story in Airtable and triggers generation.

```typescript
// Request
{
  "storyName": "LA Robbery News",
  "storyType": "recXXX", // Airtable record ID
  "sourceType": "text" | "url" | "audio",
  "source": "..." // text content, URL, or base64 audio
}

// Response
{
  "storyId": "recYYY",
  "status": "QUEUED"
}
```

### GET /api/faceless-video/story/[id]
Gets story status and progress.

```typescript
// Response
{
  "storyId": "recYYY",
  "storyName": "LA Robbery News",
  "status": "PROCESSING",
  "progress": {
    "storyGenerated": true,
    "scenesCreated": 6,
    "shotsCreated": 18,
    "imagesGenerated": 12,
    "audioGenerated": 8,
    "videosGenerated": 4,
    "shotsComplete": 2
  },
  "finalVideo": null // URL when complete
}
```

### GET /api/faceless-video/story-types
Gets available story types.

```typescript
// Response
{
  "storyTypes": [
    { "id": "recXXX", "name": "Comic Book News", "description": "..." },
    { "id": "recYYY", "name": "Classic Dramatic", "description": "..." }
  ]
}
```

---

## Implementation Steps

### Phase 1: Setup & Story Types
- [ ] Add Airtable env variables
- [ ] Create Airtable API client
- [ ] Implement GET /api/faceless-video/story-types
- [ ] Create basic UI with story type selector

### Phase 2: Story Creation
- [ ] Implement POST /api/faceless-video/create-story
- [ ] Handle text/URL/audio inputs
- [ ] Connect to Airtable Stories table
- [ ] Trigger "Approve Source" checkbox

### Phase 3: Progress Tracking
- [ ] Implement GET /api/faceless-video/story/[id]
- [ ] Poll for updates from Airtable
- [ ] Create progress dashboard UI
- [ ] WebSocket or SSE for real-time updates (optional)

### Phase 4: Completion & Download
- [ ] Detect when final video is ready
- [ ] Serve video download link
- [ ] Create completion UI

### Phase 5: Dashboard Integration
- [ ] List user's video projects
- [ ] Show status of each project
- [ ] Allow re-downloading past videos

---

## Files to Create/Modify

### New Files
- `app/tools/faceless-video-generator/page.tsx` (rewrite)
- `app/api/faceless-video/story-types/route.ts`
- `app/api/faceless-video/create-story/route.ts` (rewrite)
- `app/api/faceless-video/story/[id]/route.ts`
- `lib/services/faceless-video-airtable.ts`
- `components/FacelessVideoForm.tsx`
- `components/FacelessVideoProgress.tsx`

### Files to Remove
- Current MinIO/n8n based implementation
- `components/VideoGeneratorForm.tsx`

---

## Questions to Resolve

1. **Airtable Access**: Do you have the Airtable base ID and API token for the Faceless Video base?

2. **Story Types**: Which story types should be available? The CSV shows:
   - Classic Dramatic Movie
   - Comic Book News
   - Faceless YouTube Video
   - INSTALL HELPER (likely for testing)

3. **Approval Flow**: Should users:
   - Auto-approve (fully automated)
   - Review story before generating scenes
   - Review each scene before generating shots

4. **User Association**: How do we associate stories with users?
   - Add email field to Stories table?
   - Create separate user tracking?

5. **Pricing/Access**: Is this a free tool or premium?
   - If premium, what tier?
   - Should we track usage/credits?

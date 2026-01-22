# n8n Webhook Integration Guide

## Overview

Your original n8n workflow uses a **manual trigger**, which only works when you manually click "Execute" in the n8n UI. To integrate with the Faceless Video Generator API, you need a **webhook trigger** that can be called programmatically.

## Key Differences

### Original Workflow (Manual Trigger)
```json
{
  "type": "n8n-nodes-base.manualTrigger"
}
```
- ❌ Can only be triggered manually from n8n UI
- ❌ Not accessible via HTTP/API
- ✅ Good for testing individual workflows

### Updated Workflow (Webhook Trigger)
```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "faceless-video"
  }
}
```
- ✅ Can be triggered via HTTP POST request
- ✅ Accessible at: `http://localhost:5678/webhook/faceless-video`
- ✅ Works with your API integration

## Setup Instructions

### 1. Import the Webhook Workflow

1. Open n8n: `http://localhost:5678`
2. Click **Workflows** → **Import from File**
3. Select: `n8n-workflows/NCA-Toolkit-Webhook.n8n.json`
4. Click **Import**

### 2. Activate the Workflow

1. Open the imported workflow
2. Click the **Activate** toggle in the top-right corner
3. Verify the webhook URL appears in the **Webhook** node

Expected webhook URL:
```
http://localhost:5678/webhook/faceless-video
```

### 3. Test the Webhook

#### Option A: Test from Command Line
```bash
curl -X POST http://localhost:5678/webhook/faceless-video \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test-job-123",
    "user_id": "test-user-456",
    "webhook_callback": "http://localhost:3000/api/faceless-video/webhook",
    "scenes": [
      {
        "image": "http://localhost:9000/nca-toolkit-local/uploads/test/scene_0.png",
        "audio": "http://localhost:9000/nca-toolkit-local/uploads/test/scene_0.mp3"
      }
    ],
    "caption_settings": {
      "font_family": "The Bold Font",
      "font_size": 60,
      "line_color": "#FFFFFF",
      "word_color": "#66ff74",
      "max_words_per_line": 3,
      "position": "bottom_center",
      "style": "highlight"
    }
  }'
```

#### Option B: Test from Your App
1. Start your Next.js dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/tools/faceless-video-generator`
3. Upload files and click "Generate Video"
4. The API will automatically trigger the n8n webhook

## Webhook Payload Structure

The API sends this JSON payload to n8n:

```typescript
{
  job_id: string;           // Unique job identifier
  user_id: string;          // User who created the job
  webhook_callback: string; // URL to call when complete
  base_url?: string;        // NCA Toolkit API URL (optional, defaults to http://ncat:8080)
  scenes: Array<{
    image: string;          // MinIO URL to image file
    audio: string;          // MinIO URL to audio file
  }>;
  caption_settings: {
    font_family: string;    // e.g., "The Bold Font"
    font_size: number;      // e.g., 60
    line_color: string;     // Hex color, e.g., "#FFFFFF"
    word_color: string;     // Hex color, e.g., "#66ff74"
    max_words_per_line: number;  // e.g., 3
    position: string;       // "top_center" | "center" | "bottom_center"
    style: string;          // "highlight" | "outline" | "shadow"
  };
}
```

## Workflow Process Flow

```
1. Webhook Trigger
   ↓
2. Extract Webhook Payload (parse request body)
   ↓
3. Build Scenes Array (format scenes for processing)
   ↓
4. Split Scenes (process each scene individually)
   ↓
5. Generate Video with Ken Burns (apply zoom effect)
   ↓
6. Merge Video URLs (collect all generated videos)
   ↓
7. Split for Trimming (process each scene again)
   ↓
8. Get Audio Metadata (get duration for each audio file)
   ↓
9. Trim Video to Audio Length (match video to audio)
   ↓
10. Combine Audio + Video (merge audio and video streams)
    ↓
11. Build Concatenation Array (prepare for merging)
    ↓
12. Concatenate Videos (merge all scenes into one)
    ↓
13. Add Animated Captions (apply word-by-word captions)
    ↓
14. Send Success Callback (notify Next.js API)
```

## Callback Response

When the workflow completes, it calls your API webhook with:

```json
{
  "job_id": "your-job-id",
  "status": "COMPLETED",
  "output_video_url": "https://...",
  "video_duration": 45.5,
  "file_size": 15728640
}
```

Your API endpoint at `/api/faceless-video/webhook` handles this callback and updates the database.

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
# n8n Webhook URL
N8N_FACELESS_VIDEO_WEBHOOK=http://localhost:5678/webhook/faceless-video

# Callback URL (where n8n sends results)
NEXTAUTH_URL=http://localhost:3000
```

The callback URL is automatically constructed as:
```
${NEXTAUTH_URL}/api/faceless-video/webhook
```

## Troubleshooting

### Webhook Returns 404
- **Problem**: n8n can't find the webhook endpoint
- **Solution**: Make sure the workflow is **activated** (toggle is ON)
- **Verify**: Check the webhook URL in the Webhook node

### Workflow Doesn't Start
- **Problem**: Payload format is incorrect
- **Solution**: Verify your API is sending the correct JSON structure
- **Debug**: Check n8n's **Executions** tab for errors

### NCA Toolkit API Errors
- **Problem**: Can't connect to `http://ncat:8080`
- **Solution**:
  - If running locally: Update `base_url` in the payload to `http://localhost:8080`
  - If using Docker: Make sure containers are on the same network

### Callback Never Fires
- **Problem**: n8n can't reach your Next.js app
- **Solution**:
  - Check that `webhook_callback` URL is accessible from n8n
  - If using Docker, use host network or service names
  - Test callback manually: `curl -X POST http://localhost:3000/api/faceless-video/webhook ...`

## Key Changes from Original Workflow

1. **Trigger**: Changed from `manualTrigger` to `webhook`
2. **Input Source**: Reads from webhook body instead of hardcoded variables
3. **Dynamic Caption Settings**: Uses settings from the API payload
4. **Callback Node**: Added final step to notify your API when complete
5. **Job ID Tracking**: Uses job ID from payload for tracking and callbacks

## Production Considerations

### For Production n8n Cloud:
```bash
# Update your .env.local
N8N_FACELESS_VIDEO_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/faceless-video
```

### For Production NCA Toolkit:
- Update the `base_url` in your n8n workflow or send it in the payload
- Ensure the NCA Toolkit API is publicly accessible or on the same network

### Security:
- Add API key authentication to your webhook
- Validate webhook source (n8n IP allowlist)
- Use HTTPS in production
- Add webhook signature verification

## Migration Steps

If you want to keep both workflows:

1. **Keep Original**: For manual testing in n8n UI
2. **Use Webhook Version**: For API integration

Or replace the manual trigger with webhook trigger:
1. Open your original workflow
2. Delete the "Manual Trigger" node
3. Add a "Webhook" node with path `faceless-video`
4. Connect it to "Set Variables" node
5. Update "Set Variables" to read from `$json.body.*` instead of hardcoded values

## Testing Checklist

- [ ] n8n is running and accessible
- [ ] Workflow is imported
- [ ] Workflow is activated (toggle ON)
- [ ] Webhook URL is visible in n8n
- [ ] NCA Toolkit API is running
- [ ] MinIO is running with files accessible
- [ ] Test webhook with curl succeeds
- [ ] Test from Next.js app creates job
- [ ] Workflow executes without errors
- [ ] Callback updates database correctly
- [ ] Final video is accessible

---

**Status**: ✅ Webhook workflow ready for integration. Import and activate to enable API-triggered video generation.

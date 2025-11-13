# Faceless Video Generator - Setup Guide

This guide explains how to set up and integrate the Faceless Video Generator with your local NCA Toolkit API and n8n workflow.

## Overview

The Faceless Video Generator creates professional faceless videos from image/audio pairs with:
- Ken Burns zoom effects on images
- Audio synchronization and trimming
- Animated word-by-word captions (TikTok-style)
- Multiple scenes concatenated into one video
- Custom caption styling (fonts, colors, positions)

## Architecture

```
Frontend (Next.js)
  ↓ Upload files
Backend API (/api/faceless-video/create)
  ↓ Store in MinIO
  ↓ Create database record
  ↓ Trigger webhook
n8n Workflow
  ↓ Process video (NCA Toolkit API)
  ↓ Callback webhook
Backend API (/api/faceless-video/webhook)
  ↓ Update database
Dashboard (Display result)
```

## Prerequisites

1. **MinIO** - S3-compatible storage running on `http://localhost:9000`
2. **NCA Toolkit API** - Video processing API on `http://localhost:8080`
3. **n8n** - Workflow automation on `http://localhost:5678`
4. **PostgreSQL** - Database with Prisma

## Environment Variables

Add these to your `.env` file:

```bash
# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=nca-toolkit-local

# n8n Webhook Configuration
N8N_FACELESS_VIDEO_WEBHOOK=http://localhost:5678/webhook/faceless-video
N8N_WEBHOOK_SECRET=local-dev-secret-123

# NCA Toolkit API
NCA_TOOLKIT_API_URL=http://localhost:8080
NCA_TOOLKIT_API_KEY=local-dev-key-123

# Your app URL (for webhook callbacks)
NEXTAUTH_URL=http://localhost:3000
```

## Database Setup

1. **Run Prisma migration:**

```bash
npx prisma migrate dev --name add_faceless_video_models
```

2. **Generate Prisma client:**

```bash
npx prisma generate
```

3. **Verify tables created:**

```bash
npx prisma studio
```

You should see:
- `faceless_video_jobs`
- `video_scenes`

## MinIO Setup

1. **Start MinIO:**

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

2. **Create bucket:**

Access MinIO Console at `http://localhost:9001` and:
- Login with `minioadmin` / `minioadmin123`
- Create bucket: `nca-toolkit-local`
- Set bucket policy to "public" (or configure as needed)

## n8n Workflow Setup

Create a new workflow in n8n with the following nodes:

### 1. Webhook Trigger Node

- **Method:** POST
- **Path:** `/webhook/faceless-video`
- **Authentication:** Header Auth
  - Header Name: `x-webhook-secret`
  - Header Value: `local-dev-secret-123`

**Expected Payload:**
```json
{
  "job_id": "uuid",
  "user_id": "uuid",
  "webhook_callback": "http://localhost:3000/api/faceless-video/webhook",
  "scenes": [
    {
      "image": "http://localhost:9000/nca-toolkit-local/uploads/userId/scene0.png",
      "audio": "http://localhost:9000/nca-toolkit-local/uploads/userId/scene0.mp3"
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
}
```

### 2. Loop Over Scenes

Use a **Loop Over Items** node to process each scene individually.

### 3. For Each Scene:

#### A. Convert Image to Video (Ken Burns effect)
```
POST http://localhost:8080/v1/image/convert/video
Headers:
  x-api-key: local-dev-key-123
  Content-Type: application/json
Body:
{
  "imageUrl": "{{ $json.image }}",
  "duration": 10,
  "zoomEffect": "ken_burns"
}
Response: { "videoUrl": "..." }
```

#### B. Get Audio Duration
```
POST http://localhost:8080/v1/media/metadata
Body: { "audioUrl": "{{ $json.audio }}" }
Response: { "duration": 10.5 }
```

#### C. Trim Video to Audio Length
```
POST http://localhost:8080/v1/video/trim
Body: {
  "videoUrl": "{{ step2.videoUrl }}",
  "duration": "{{ step3.duration }}"
}
```

#### D. Compose Video + Audio
```
POST http://localhost:8080/v1/ffmpeg/compose
Body: {
  "videoUrl": "{{ step4.videoUrl }}",
  "audioUrl": "{{ $json.audio }}"
}
Response: { "composedUrl": "..." }
```

### 4. Concatenate All Scenes

After loop completes, use **Aggregate** node to collect all scene videos, then:

```
POST http://localhost:8080/v1/video/concatenate
Body: {
  "videos": ["{{ scene1Url }}", "{{ scene2Url }}", ...]
}
Response: { "finalVideoUrl": "..." }
```

### 5. Add Captions

```
POST http://localhost:8080/v1/video/caption
Body: {
  "videoUrl": "{{ step5.finalVideoUrl }}",
  "captionSettings": "{{ $node.Webhook.json.caption_settings }}"
}
Response: { "captionedVideoUrl": "..." }
```

### 6. Get Final Video Metadata

```
POST http://localhost:8080/v1/media/metadata
Body: { "videoUrl": "{{ step6.captionedVideoUrl }}" }
Response: {
  "duration": 42.5,
  "fileSize": 15728640
}
```

### 7. Callback Webhook (Success)

```
POST {{ $node.Webhook.json.webhook_callback }}
Headers:
  x-webhook-secret: local-dev-secret-123
  Content-Type: application/json
Body:
{
  "job_id": "{{ $node.Webhook.json.job_id }}",
  "status": "completed",
  "output_video_url": "{{ step6.captionedVideoUrl }}",
  "video_duration": {{ step7.duration }},
  "file_size": {{ step7.fileSize }}
}
```

### 8. Error Handler (On Failure)

Add an **On Error** workflow that sends:

```
POST {{ $node.Webhook.json.webhook_callback }}
Body:
{
  "job_id": "{{ $node.Webhook.json.job_id }}",
  "status": "failed",
  "error_message": "{{ $json.error }}"
}
```

## Testing the Integration

### 1. Start All Services

```bash
# Terminal 1: MinIO
docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"

# Terminal 2: NCA Toolkit API
cd nca-toolkit
npm start

# Terminal 3: n8n
n8n start

# Terminal 4: Your Next.js app
npm run dev
```

### 2. Test the Workflow

1. Go to `http://localhost:3000/tools/faceless-video-generator`
2. Sign in if not authenticated
3. Upload at least one image/audio pair
4. Customize caption settings (optional)
5. Click "Generate Video"
6. You'll be redirected to dashboard
7. Watch the job progress in real-time
8. Download the video when complete

### 3. Monitor Logs

**Backend logs:**
```bash
npm run dev
# Watch for:
# - File uploads to MinIO
# - n8n webhook trigger
# - Webhook callbacks
```

**n8n workflow:**
- Open n8n at `http://localhost:5678`
- Go to your workflow
- Click "Executions" to see real-time progress

## API Endpoints

### `POST /api/faceless-video/create`
Creates a new video generation job.

**Form Data:**
- `sceneCount`: number
- `scene_{i}_image`: File (PNG/JPG, max 10MB)
- `scene_{i}_audio`: File (MP3/WAV, max 50MB)
- `fontFamily`: string (optional)
- `fontSize`: number (optional)
- `lineColor`: string (optional)
- `wordColor`: string (optional)
- `maxWordsPerLine`: number (optional)
- `position`: string (optional)
- `style`: string (optional)

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "message": "Video generation started successfully"
}
```

### `GET /api/faceless-video/jobs`
List all jobs for authenticated user.

**Query Params:**
- `status`: filter by status (optional)
- `limit`: number of results (default: 50)
- `offset`: pagination offset (default: 0)

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "status": "COMPLETED",
      "progress": 100,
      "outputVideoUrl": "...",
      "videoDuration": 42.5,
      "fileSize": 15728640,
      "scenes": [...]
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

### `GET /api/faceless-video/[jobId]`
Get details for a specific job.

**Response:**
```json
{
  "job": {
    "id": "uuid",
    "status": "COMPLETED",
    "outputVideoUrl": "...",
    "scenes": [...]
  }
}
```

### `POST /api/faceless-video/webhook`
Webhook endpoint for n8n to call when processing completes.

**Headers:**
- `x-webhook-secret`: your webhook secret

**Body:**
```json
{
  "job_id": "uuid",
  "status": "completed" | "failed",
  "output_video_url": "..." (if completed),
  "error_message": "..." (if failed),
  "video_duration": 42.5 (optional),
  "file_size": 15728640 (optional)
}
```

## Troubleshooting

### MinIO Connection Issues

```bash
# Test MinIO connection
curl http://localhost:9000/minio/health/live
```

### n8n Webhook Not Triggering

1. Check webhook URL is correct in environment variables
2. Verify n8n workflow is activated
3. Check n8n execution history for errors
4. Test webhook directly:

```bash
curl -X POST http://localhost:5678/webhook/faceless-video \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: local-dev-secret-123" \
  -d '{"job_id": "test", "user_id": "test", "scenes": []}'
```

### Database Connection Issues

```bash
# Test database connection
npx prisma db push

# View tables
npx prisma studio
```

### NCA Toolkit API Issues

```bash
# Test API connectivity
curl -X GET http://localhost:8080/health \
  -H "x-api-key: local-dev-key-123"
```

## Production Deployment

### Environment Variables

Update these for production:

```bash
MINIO_ENDPOINT=https://your-minio-domain.com
MINIO_ACCESS_KEY=<your-access-key>
MINIO_SECRET_KEY=<your-secret-key>
MINIO_BUCKET=faceless-videos-prod

N8N_FACELESS_VIDEO_WEBHOOK=https://your-n8n.com/webhook/faceless-video
N8N_WEBHOOK_SECRET=<generate-strong-secret>

NCA_TOOLKIT_API_URL=https://your-nca-api.com
NCA_TOOLKIT_API_KEY=<your-api-key>

NEXTAUTH_URL=https://your-domain.com
```

### Security Considerations

1. **MinIO:**
   - Use strong access keys
   - Configure bucket policies (private with signed URLs)
   - Enable SSL/TLS

2. **Webhooks:**
   - Use strong webhook secrets
   - Validate all webhook payloads
   - Implement rate limiting

3. **File Uploads:**
   - Validate file types and sizes
   - Scan for malware
   - Set upload limits per user

4. **Database:**
   - Regular backups
   - Index optimization for large datasets
   - Archive old jobs periodically

## Cost Optimization

### MinIO Storage

Set lifecycle policies to auto-delete old videos:

```bash
# Delete videos older than 30 days
mc ilm add myminio/nca-toolkit-local --expiry-days 30
```

### Database Cleanup

Run periodic cleanup script:

```sql
-- Delete completed jobs older than 90 days
DELETE FROM faceless_video_jobs
WHERE status = 'COMPLETED'
AND completed_at < NOW() - INTERVAL '90 days';

-- Archive to separate table if needed
INSERT INTO faceless_video_jobs_archive
SELECT * FROM faceless_video_jobs
WHERE completed_at < NOW() - INTERVAL '90 days';
```

## Support

For issues or questions:
- Check the troubleshooting section
- Review n8n execution logs
- Check backend API logs
- Verify all services are running

## License

This implementation is part of the Full Stack Vibe Coder platform.

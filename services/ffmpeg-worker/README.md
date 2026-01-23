# FFMPEG Worker Service

Video processing service for the Faceless Video Generator. This service runs FFMPEG operations and should be deployed separately from the main Vercel app (e.g., on Railway, Render, or Fly.io).

## Endpoints

### `POST /api/video/ken-burns`
Create a video from a static image with Ken Burns (zoom/pan) effect.

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "duration": 5,
  "effect": "zoom-in",
  "width": 1920,
  "height": 1080
}
```

Effects: `zoom-in`, `zoom-out`, `pan-left`, `pan-right`, `pan-up`, `pan-down`

### `POST /api/video/mix-audio`
Overlay audio track onto video.

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "audioUrl": "https://example.com/audio.mp3",
  "volume": 1
}
```

### `POST /api/video/concatenate`
Combine multiple videos into one.

```json
{
  "videoUrls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  "transition": "none"
}
```

Transitions: `none`, `fade`

### `POST /api/video/captions`
Add SRT captions to video.

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "srtContent": "1\n00:00:00,000 --> 00:00:05,000\nHello World",
  "style": {
    "fontName": "Arial",
    "fontSize": 24,
    "fontColor": "white",
    "position": "bottom"
  }
}
```

## Environment Variables

```env
PORT=3001

# S3-compatible storage (required for production)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=faceless-videos
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com

# Optional: local development
LOCAL_STORAGE_PATH=/tmp/ffmpeg-worker/output
PUBLIC_URL=http://localhost:3001
```

## Local Development

```bash
cd services/ffmpeg-worker
npm install
npm run dev
```

Requires FFMPEG to be installed locally:
- macOS: `brew install ffmpeg`
- Ubuntu: `apt-get install ffmpeg`

## Deploy to Railway

1. Create a new project in Railway
2. Connect this repo and set the root directory to `services/ffmpeg-worker`
3. Add environment variables in Railway dashboard
4. Railway will auto-detect Dockerfile and deploy

The service uses the Dockerfile which installs FFMPEG in a slim Node.js container.

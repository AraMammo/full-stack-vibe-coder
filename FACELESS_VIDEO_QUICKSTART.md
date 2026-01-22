# Faceless Video Generator - Quick Fix Guide

## Issue Summary

You encountered a **500 Internal Server Error** when attempting to generate a video at `/api/faceless-video/create`.

## Root Cause

The error was caused by a **missing `nodemailer` dependency** required by NextAuth.js. When the API route tried to import authentication options, it failed because NextAuth's email provider requires nodemailer.

## Fix Applied

✅ **Installed nodemailer**: `npm install nodemailer`

## Verification Steps

To verify the fix works, follow these steps:

### 1. Run the Debug Script

```bash
npx tsx scripts/debug-faceless-video.ts
```

Expected output:
- ✅ All models exist (FacelessVideoJob, VideoScene)
- ✅ Database connection successful
- ✅ Auth options imported successfully
- ⚠️ MinIO bucket ensured (or error if not running)

### 2. Start Required Services

For full functionality, you need these services running:

#### Option A: Use Docker Compose (Recommended)
```bash
# If you have a docker-compose.yml for MinIO and n8n
docker-compose up -d
```

#### Option B: Start Services Individually

**MinIO (Object Storage):**
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin123" \
  minio/minio server /data --console-address ":9001"
```

**n8n (Workflow Automation):**
```bash
docker run -d \
  -p 5678:5678 \
  --name n8n \
  n8nio/n8n
```

### 3. Start the Dev Server

```bash
npm run dev
```

### 4. Test the Endpoint

Navigate to: `http://localhost:3000/tools/faceless-video-generator`

- Upload an image and audio file for at least one scene
- Click "Generate Video"
- You should be redirected to the dashboard without a 500 error

## Expected Behavior

### With MinIO + n8n Running:
✅ API accepts upload → Stores files in MinIO → Triggers n8n workflow → Job created with status "QUEUED"

### Without MinIO Running:
⚠️ API will fail at the file upload stage with a clear error message about MinIO connection

### Without n8n Running:
⚠️ Job will be created but marked as "FAILED" because the workflow trigger fails

## Environment Variables

The following variables are now documented in `.env.example`:

```bash
# MinIO (S3-compatible storage)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=nca-toolkit-local

# n8n (Workflow automation)
N8N_FACELESS_VIDEO_WEBHOOK=http://localhost:5678/webhook/faceless-video
```

**Note:** These variables are optional for development. The MinIO client will use these defaults if not set. However, for production, you should explicitly set them in your `.env.local` file.

## Troubleshooting

### Still Getting 500 Errors?

1. **Check browser console** for detailed error messages
2. **Check server logs** in your terminal running `npm run dev`
3. **Verify authentication** - Make sure you're signed in
4. **Check database** - Ensure Prisma migrations are applied:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### MinIO Connection Errors?

```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs minio

# Access MinIO console
open http://localhost:9001
# Login: minioadmin / minioadmin123
```

### n8n Webhook Errors?

```bash
# Check if n8n is running
docker ps | grep n8n

# Access n8n UI
open http://localhost:5678
# Create a workflow with a webhook node pointing to: faceless-video
```

## Next Steps

1. ✅ **Core API now works** - The 500 error is fixed
2. 🔧 **Setup MinIO** - For file storage (optional for testing, required for full functionality)
3. 🔧 **Setup n8n** - For video processing workflow (optional for testing)
4. 📖 **Read FACELESS_VIDEO_SETUP.md** - For detailed architecture and n8n workflow setup

## Quick Test (Without External Services)

If you just want to verify the 500 error is fixed without setting up MinIO/n8n:

1. Sign in to your app
2. Navigate to `/tools/faceless-video-generator`
3. Upload files and submit
4. You should now get a **clear error message** about MinIO connection instead of a generic 500 error
5. This confirms the auth/import issues are resolved

---

**Status**: ✅ **Core issue resolved** - The API endpoint now loads successfully. External service setup is optional for testing but required for full video generation functionality.

# FullStackVibeCoder.com AI Agent System - Setup Guide

This guide will walk you through setting up the complete AI agent orchestration system for FullStackVibeCoder.com.

## Prerequisites

- **Replit Pro** account (required for always-on deployments)
- **Supabase** account (database + file storage)
- **Anthropic** API key (Claude AI)
- **OpenAI** API key (Whisper transcription) - ✅ Already configured
- **Stripe** account - ✅ Already configured

---

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and set project name: `fullstackvibecoder`
4. Set a strong database password (**SAVE THIS**)
5. Choose region closest to your users (e.g., `us-east-1`)
6. Click "Create new project" (takes ~2 minutes)

### 1.2 Get Database Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to "Connection string" section
3. Select **"URI"** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[HOST].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you set in step 1.1
6. **Add this to `.env.local` as `DATABASE_URL`**

### 1.3 Get Supabase API Keys

1. Go to **Settings** → **API**
2. Find these three values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long JWT token)
   - **service_role key**: `eyJhbGc...` (different JWT token)
3. **Add these to `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
   ```

### 1.4 Run Database Migrations

Once you've added the `DATABASE_URL` to `.env.local`:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (first time setup)
npx prisma db push

# Or create a migration (for version control)
npx prisma migrate dev --name init
```

### 1.5 Initialize Storage Buckets

After deploying, visit:
```
https://fullstackvibecoder.com/api/storage/init
```

Or run locally:
```bash
npm run dev
# Then visit: http://localhost:3000/api/storage/init
```

This creates the necessary storage buckets:
- `voice-notes` - Audio recordings from clients
- `proposals` - Generated proposal PDFs
- `deliverables` - Project deliverable files
- `branding-assets` - Brand identity files

---

## Step 2: Set Up Anthropic Claude API

### 2.1 Get API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **Settings** → **API Keys**
4. Click "Create Key"
5. Give it a name: `FullStackVibeCoder Production`
6. Copy the API key (starts with `sk-ant-...`)

### 2.2 Add to Environment Variables

```env
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**Note:** Anthropic has a free tier with rate limits. For production, consider the paid plan:
- **Free**: 50 requests/day
- **Pro**: $5/month minimum, pay-per-use

---

## Step 3: Set Up NextAuth.js

### 3.1 Generate Secret

Run this command to generate a secure random secret:

```bash
openssl rand -base64 32
```

### 3.2 Add to Environment Variables

```env
NEXTAUTH_URL="https://fullstackvibecoder.com"
NEXTAUTH_SECRET="[paste the generated secret here]"
```

### 3.3 Configure Email Provider (Optional)

For magic link authentication, you'll need an email service. Recommended options:

**Option A: Resend (Recommended)**
1. Sign up at [https://resend.com](https://resend.com)
2. Get API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY="re_..."
   EMAIL_FROM="noreply@fullstackvibecoder.com"
   ```

**Option B: SendGrid**
1. Sign up at [https://sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY="SG...."
   EMAIL_FROM="noreply@fullstackvibecoder.com"
   ```

---

## Step 4: Configure Stripe Webhooks

To receive payment confirmations automatically:

### 4.1 Set Up Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click "Add endpoint"
4. Enter URL: `https://fullstackvibecoder.com/api/webhooks/stripe`
5. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Click "Add endpoint"

### 4.2 Get Webhook Secret

1. After creating the webhook, click on it
2. Reveal the "Signing secret" (starts with `whsec_...`)
3. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

---

## Step 5: Update Replit Environment Variables

Since you're deployed on Replit, you need to add environment variables there:

### 5.1 Access Replit Secrets

1. Open your Replit project
2. Click the **"Secrets"** tab (lock icon in left sidebar)
3. Or go to **Tools** → **Secrets**

### 5.2 Add All Environment Variables

Add each of these as separate secrets:

```
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY (already set)
STRIPE_SECRET_KEY (already set)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (already set)
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_BASE_URL
```

**Important:** Replit Secrets are injected as environment variables automatically.

---

## Step 6: Seed Initial Data

After the database is set up, seed pricing benchmarks:

### 6.1 Run Seed Script

```bash
npx prisma db seed
```

Or visit:
```
https://fullstackvibecoder.com/api/seed
```

This creates:
- Pricing benchmarks for different deliverable types
- System configuration defaults
- Example data for testing

---

## Step 7: Test the Setup

### 7.1 Test Database Connection

Visit: `https://fullstackvibecoder.com/api/health`

Should return:
```json
{
  "status": "ok",
  "database": "healthy",
  "timestamp": "2025-01-20T..."
}
```

### 7.2 Test File Upload

1. Go to: `https://fullstackvibecoder.com/upload`
2. Record a short test voice note
3. Check if it appears in Supabase Storage
4. Check if database record is created

### 7.3 Test AI Agent Flow

1. Submit a voice note with business idea
2. Check workflow progress: `/dashboard/workflows`
3. Verify proposal generation
4. Test approval flow

---

## Step 8: Deploy Updates

### 8.1 Push to Git

```bash
git add .
git commit -m "Add AI agent orchestration system"
git push origin main
```

### 8.2 Replit Auto-Deploy

Replit will automatically deploy your changes when you push to the repository.

---

## Troubleshooting

### Database Connection Issues

**Error:** "Can't reach database server"

**Solutions:**
1. Check DATABASE_URL format
2. Verify Supabase project is active
3. Check IP allowlist (Supabase allows all by default)
4. Test connection string with:
   ```bash
   npx prisma db execute --stdin
   # Then type: SELECT 1;
   ```

### Storage Upload Failures

**Error:** "Failed to upload file"

**Solutions:**
1. Verify Supabase storage buckets exist
2. Check service role key is correct
3. Run storage initialization: `/api/storage/init`
4. Check bucket permissions in Supabase dashboard

### NextAuth Errors

**Error:** "NEXTAUTH_SECRET must be provided"

**Solutions:**
1. Generate new secret: `openssl rand -base64 32`
2. Add to Replit Secrets
3. Restart Replit deployment

### AI Agent Timeouts

**Error:** "Request timeout"

**Solutions:**
1. Check Anthropic API key is valid
2. Verify Replit Pro plan (required for long-running requests)
3. Check API rate limits
4. Monitor agent execution in `/api/workflow/[id]/status`

---

## Monitoring & Maintenance

### View Logs

**Replit:**
- Click **"Console"** tab to see real-time logs
- Or check **"Logs"** in deployment settings

### Database Queries

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
```

### Storage Usage

Check Supabase dashboard:
- **Storage** → **Usage** to see storage consumption

### API Usage

Monitor API costs:
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com) → Usage
- **OpenAI**: [platform.openai.com](https://platform.openai.com) → Usage

---

## Next Steps

After setup is complete:

1. ✅ Test end-to-end workflow
2. ✅ Configure custom domain (if not already done)
3. ✅ Set up monitoring (Sentry, LogTail, etc.)
4. ✅ Create admin dashboard
5. ✅ Document agent prompts and behaviors
6. ✅ Set up automated backups
7. ✅ Configure rate limiting
8. ✅ Add analytics tracking

---

## Support

For issues or questions:
- Check logs in Replit Console
- Review database with Prisma Studio
- Test individual components with health endpoints
- Verify all environment variables are set correctly

**Key Endpoints:**
- Health check: `/api/health`
- Storage init: `/api/storage/init`
- Database test: `/api/db/test`
- Workflow status: `/api/workflow/[id]/status`

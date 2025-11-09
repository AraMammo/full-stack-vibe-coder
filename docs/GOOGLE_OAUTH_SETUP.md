# Google OAuth Setup Guide

Complete guide to enable Google Sign-In for FullStackVibeCoder.

---

## Why This Is Critical

**Current Problem:**
- Users cannot log in
- No way to associate BIAB outputs with specific users
- Dashboard is inaccessible
- Payments are not linked to user accounts

**After Setup:**
- Users can sign in with Google
- All BIAB projects linked to user accounts
- Secure user-specific dashboards
- Payment history tracked per user

---

## Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### 1.2 Create a New Project (or select existing)

1. Click the project dropdown at the top
2. Click "New Project"
3. Name: `FullStackVibeCoder`
4. Click "Create"

### 1.3 Enable Google+ API

1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### 1.4 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for public users)
3. Click "Create"

**Fill in required fields:**
- App name: `FullStackVibeCoder`
- User support email: `ara@foundercorepro.com`
- App logo: (optional - upload your logo)
- Application home page: `https://fullstackvibecoder.com`
- Application privacy policy: `https://fullstackvibecoder.com/privacy-policy`
- Application terms of service: `https://fullstackvibecoder.com/terms-of-service`
- Authorized domains: `fullstackvibecoder.com`
- Developer contact: `ara@foundercorepro.com`

4. Click "Save and Continue"
5. **Scopes:** Click "Add or Remove Scopes"
   - Select: `email` (required)
   - Select: `profile` (required)
   - Select: `openid` (required)
6. Click "Save and Continue"
7. **Test users:** Add your email for testing
8. Click "Save and Continue"

### 1.5 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `FullStackVibeCoder Production`

**Authorized JavaScript origins:**
```
https://fullstackvibecoder.com
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://fullstackvibecoder.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

5. Click "Create"
6. **COPY THESE VALUES** (you'll need them for Replit):
   - Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123xyz789`)

---

## Step 2: Add Credentials to Replit Secrets

### 2.1 Open Replit Secrets

1. Go to your Replit project
2. Click the 🔒 (lock) icon in the left sidebar
3. Click "New Secret"

### 2.2 Add Google OAuth Credentials

**Secret 1:**
- Name: `GOOGLE_CLIENT_ID`
- Value: (paste your Client ID from Google Console)

**Secret 2:**
- Name: `GOOGLE_CLIENT_SECRET`
- Value: (paste your Client Secret from Google Console)

### 2.3 Verify NEXTAUTH_URL

Make sure you have:
- Name: `NEXTAUTH_URL`
- Value: `https://fullstackvibecoder.com` (or your Replit URL)

### 2.4 Restart Replit

After adding secrets, restart your Replit to load the new environment variables.

---

## Step 3: Verify Configuration

### 3.1 Check Server Logs

When your app starts, you should see:

```
[NextAuth] Configuration:
  - NEXTAUTH_SECRET: ✅ Set
  - Email Provider: ⚠️ Disabled (SMTP not configured)
  - Google OAuth: ✅ Enabled  ← This should now show ✅
```

If you see "✅ Enabled" for Google OAuth, you're all set!

### 3.2 Test Sign-In

1. Go to: `https://fullstackvibecoder.com/auth/signin`
2. Click "Sign in with Google"
3. Authorize the app
4. You should be redirected to the dashboard

---

## Step 4: Production Considerations

### 4.1 Remove Test Mode (Optional)

By default, OAuth consent screen is in "Testing" mode (max 100 users).

To go live:
1. Go to "OAuth consent screen"
2. Click "Publish App"
3. Submit for verification (if required)

### 4.2 Security Best Practices

✅ **DO:**
- Keep Client Secret in Replit Secrets (never commit to git)
- Use HTTPS in production
- Regularly rotate secrets
- Monitor sign-in activity

❌ **DON'T:**
- Share your Client Secret publicly
- Use the same credentials for dev and prod
- Allow unauthorized redirect URIs

---

## Step 5: User Flow After Setup

### For New Users:
1. Visit homepage
2. Click "Market-Ready Business" or any tier
3. Redirected to `/auth/signin`
4. Sign in with Google
5. Redirected to Stripe checkout
6. After payment → BIAB workflow starts
7. Email sent with download link
8. Can view all projects in dashboard

### For Returning Users:
1. Visit site → automatically signed in (session cookie)
2. Can access dashboard immediately
3. See all past projects and payments
4. Purchase additional tiers

---

## Troubleshooting

### "Redirect URI mismatch" error

**Cause:** The redirect URI in your app doesn't match Google Console

**Fix:**
1. Check the error message for the actual URI being used
2. Add that exact URI to Google Console → Credentials → Authorized redirect URIs
3. Wait 5 minutes for changes to propagate

### "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured properly

**Fix:**
1. Complete ALL required fields in OAuth consent screen
2. Add authorized domains
3. Add test users (if in Testing mode)

### "User not found" after sign-in

**Cause:** Database connection issue or Prisma adapter problem

**Fix:**
1. Check DATABASE_URL in Replit Secrets
2. Run: `npx prisma db push` to sync schema
3. Check server logs for Prisma errors

### Google OAuth not showing as "Enabled"

**Cause:** Environment variables not loaded

**Fix:**
1. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Replit Secrets
2. Restart Replit
3. Check for typos in secret names (must match exactly)

---

## Environment Variables Checklist

Make sure ALL of these are in Replit Secrets:

### Required:
- ✅ `NEXTAUTH_SECRET` - Session encryption key
- ✅ `NEXTAUTH_URL` - Your app URL
- ✅ `GOOGLE_CLIENT_ID` - From Google Console
- ✅ `GOOGLE_CLIENT_SECRET` - From Google Console
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `STRIPE_SECRET_KEY` - Payment processing
- ✅ `SENDGRID_API_KEY` - Transactional emails
- ✅ `ANTHROPIC_API_KEY` - BIAB AI workflow
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - File storage

### Optional:
- `SENDGRID_REPLY_TO_EMAIL` (defaults to ara@foundercorepro.com)
- `VERCEL_V0_API_KEY` (for website generation in Turnkey tier)
- `DUMPLING_API` (for logo generation)

---

## Next Steps After Setup

Once Google OAuth is working:

1. ✅ Test sign-in flow
2. ✅ Purchase a test BIAB package
3. ✅ Verify project appears in dashboard
4. ✅ Test email notifications
5. ✅ Verify download links work

---

## Support

If you encounter issues:

1. Check server logs in Replit console
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure OAuth consent screen is published (if out of test mode)

---

## Summary

**Before:**
- No user authentication
- No way to track user's projects
- Dashboard inaccessible

**After:**
- Users sign in with Google (trusted, secure)
- All projects linked to user accounts
- Personalized dashboard with project history
- Seamless payment-to-user association

**Time to setup:** 10-15 minutes

Let's get your users authenticated! 🚀

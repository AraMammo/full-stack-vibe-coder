# BIAB Debug Quick Reference Card

## 🔍 Quick Checks (Open Browser DevTools - F12 or Cmd+Option+I)

### ✅ 1. SessionStorage Persistence Check

**Location:** DevTools → Application → Session Storage → `http://localhost:3000`

**Expected:**
```
Key: selectedTier
Value: "VALIDATION_PACK" | "LAUNCH_BLUEPRINT" | "TURNKEY_SYSTEM"
```

**Console Commands:**
```javascript
// Check current value
sessionStorage.getItem('selectedTier')

// Set manually for testing
sessionStorage.setItem('selectedTier', 'LAUNCH_BLUEPRINT')

// Clear
sessionStorage.clear()
```

**What to look for in console:**
```
[Pricing] 🎯 User clicked tier: LAUNCH_BLUEPRINT
[Pricing] 💾 Tier saved to sessionStorage: LAUNCH_BLUEPRINT
[Pricing] ✓ Verification - sessionStorage contains: LAUNCH_BLUEPRINT
[Pricing] 🚀 Redirecting to /upload
[Upload] 🔍 Checking sessionStorage for tier: LAUNCH_BLUEPRINT
[Upload] ✅ Valid tier found in sessionStorage: LAUNCH_BLUEPRINT
```

**If broken:**
- ❌ No console logs → Check page loaded correctly
- ❌ Value is `null` → Check browser allows sessionStorage
- ❌ Wrong value → Check tier ID matches enum exactly

---

### ✅ 2. SSE Connection Check

**Location:** DevTools → Network tab → Filter: "stream"

**Expected:**
```
Request URL: /api/project/[project-id]/stream
Status: pending (or 200)
Type: text/event-stream
```

**Click request → Response tab should show:**
```
data: {"projectId":"abc123","completedCount":3,"totalCount":16,"progress":18,...}

data: {"projectId":"abc123","completedCount":4,"totalCount":16,"progress":25,...}

(updates every 2 seconds)
```

**What to look for in console:**
```
[BIABProjectCard] Connecting to SSE for project: abc123-def456
[BIABProjectCard] ✅ SSE connection opened
[BIABProjectCard] 📊 Progress update: { progress: 25, completed: 4, total: 16, current: "Competitive Analysis", status: "IN_PROGRESS" }
[BIABProjectCard] 📊 Progress update: { progress: 31, completed: 5, total: 16, current: "Target Audience", status: "IN_PROGRESS" }
```

**If broken:**
- ❌ **404 Not Found** → Check API route exists: `app/api/project/[id]/stream/route.ts`
- ❌ **401 Unauthorized** → User not logged in
- ❌ **403 Forbidden** → User doesn't own this project
- ❌ **Connection closes immediately** → Project status is not IN_PROGRESS or PENDING
- ❌ **No console logs** → Component not mounted or `isInProgress` is false

**Manual test in console:**
```javascript
// Replace PROJECT_ID with actual project ID
const es = new EventSource('/api/project/PROJECT_ID/stream');
es.onmessage = (e) => console.log('SSE:', JSON.parse(e.data));
es.onerror = (e) => console.error('SSE Error:', e);

// When done testing:
es.close();
```

---

### ✅ 3. Tier Badge Colors

**Visual Reference:**

| Tier | Badge Color | CSS Class | Hex Color |
|------|-------------|-----------|-----------|
| **Validation Pack** | 🔵 Blue | `bg-blue-500` | `#3b82f6` |
| **Launch Blueprint** | 🟣 Purple | `bg-purple-500` | `#a855f7` |
| **Turnkey System** | 🟡🟠 Gold Gradient | `bg-gradient-to-r from-yellow-400 to-orange-500` | `#facc15 → #f97316` |

**Where to check:**
1. **Dashboard:** `components/BIABProjectCard.tsx` - Tier badge on project card
2. **Project Detail:** `app/dashboard/project/[id]/page.tsx` - Header badge
3. **Pricing Page:** `app/pricing/page.tsx` - "MOST POPULAR" badge

**Inspect element → Computed styles:**
```css
/* Validation Pack */
background-color: rgb(59, 130, 246); /* #3b82f6 - blue-500 */

/* Launch Blueprint */
background-color: rgb(168, 85, 247); /* #a855f7 - purple-500 */

/* Turnkey System */
background-image: linear-gradient(to right, rgb(251, 191, 36), rgb(249, 115, 22));
/* #fbbf24 (yellow-400) → #f97316 (orange-500) */
```

**If colors are wrong:**
Check `tierConfig` object in component:
```typescript
// In BIABProjectCard.tsx line 39-55
const tierConfig = {
  VALIDATION_PACK: { badgeColor: 'bg-blue-500' },      // ✅ Blue
  LAUNCH_BLUEPRINT: { badgeColor: 'bg-purple-500' },   // ✅ Purple
  TURNKEY_SYSTEM: { badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500' } // ✅ Gold
};
```

---

### ✅ 4. Postmark Email Sending

**Check 1: Environment Variable**
```bash
# In terminal:
printenv | grep POSTMARK
# Should show: POSTMARK_API_KEY=your-key-here

# Or in .env file:
cat .env | grep POSTMARK
```

**Check 2: Server Logs**
Look for these in terminal where `npm run dev` is running:
```
✅ Sending project-started email to user@example.com
✅ Postmark API response: 200
📧 Email sent successfully: MessageID 123456
```

**Check 3: Postmark Dashboard**
1. Visit: https://account.postmarkapp.com
2. Navigate to: **Servers** → Your Server → **Message Streams** → **Outbound**
3. Click **Activity** tab
4. Look for recent emails with subjects:
   - ✉️ "Your Business Package is Being Generated" (project started)
   - ✉️ "Your Business Package is Ready!" (project complete)

**Check 4: Email Code**
```bash
# Verify email service exists:
ls -la lib/email/postmark.ts
ls -la lib/email/templates.ts

# Check where emails are triggered:
grep -r "sendProjectStartedEmail" app/
grep -r "sendProjectCompleteEmail" app/
```

**Manual Test:**
```typescript
// Create test file: app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { sendProjectStartedEmail } from '@/lib/email/postmark';

export async function GET() {
  try {
    await sendProjectStartedEmail({
      to: 'your-email@example.com',
      projectName: 'Test Project',
      tier: 'LAUNCH_BLUEPRINT',
      userName: 'Test User'
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Then visit: http://localhost:3000/api/test-email
```

**Common Issues:**
- ❌ **401 Unauthorized** → Invalid API key, check `POSTMARK_API_KEY`
- ❌ **422 Unprocessable** → Missing required fields (to, from, subject, body)
- ❌ **300 Inactive Recipient** → Email address is bounced/complained
- ❌ **406 Not Allowed** → Sender signature not verified
- ❌ No logs at all → Email function not being called

---

## 🎯 Full Test Flow

### End-to-End Test (5 minutes)

1. **Start:** Visit `/pricing`
   ```
   Open console, clear logs (Cmd+K)
   ```

2. **Select Tier:** Click "Launch My Business" ($197)
   ```
   Console should show:
   [Pricing] 🎯 User clicked tier: LAUNCH_BLUEPRINT
   [Pricing] 💾 Tier saved to sessionStorage: LAUNCH_BLUEPRINT

   Check DevTools → Application → Session Storage:
   ✅ selectedTier = "LAUNCH_BLUEPRINT"
   ```

3. **Upload Page:** Should auto-load tier
   ```
   Console should show:
   [Upload] 🔍 Checking sessionStorage for tier: LAUNCH_BLUEPRINT
   [Upload] ✅ Valid tier found in sessionStorage: LAUNCH_BLUEPRINT

   Visual check:
   ✅ Purple "Selected Package" box visible
   ✅ Shows "Launch Blueprint - $197"
   ```

4. **Dashboard:** After upload
   ```
   Open Network tab, filter: "stream"

   Visual check:
   ✅ BIAB project card appears
   ✅ Purple tier badge: "Launch Blueprint"
   ✅ Progress bar at 0%

   Network tab:
   ✅ Request: /api/project/[id]/stream
   ✅ Status: pending
   ✅ Type: text/event-stream

   Console:
   [BIABProjectCard] Connecting to SSE for project: [id]
   [BIABProjectCard] ✅ SSE connection opened
   [BIABProjectCard] 📊 Progress update: {...}
   ```

5. **Watch Real-Time Updates:**
   ```
   Every 2 seconds, console should show:
   [BIABProjectCard] 📊 Progress update: { progress: X, ... }

   Visual:
   ✅ Progress bar animates smoothly
   ✅ "Currently generating: [Section]" updates
   ✅ Completed sections list grows
   ```

6. **Project Detail:** Click "View Details"
   ```
   Visual:
   ✅ All 16 sections listed
   ✅ Completed = green checkmark ✓
   ✅ In-progress = spinner ⏳
   ✅ Pending = empty circle ○
   ✅ Can expand/view output for completed
   ```

7. **Completion:**
   ```
   Visual:
   ✅ Progress reaches 100%
   ✅ Green "Your package is ready!" banner
   ✅ "Download Complete Package" button

   Email:
   ✅ Check inbox for completion email
   ```

---

## 🐛 Common Issues & Fixes

### Issue: SessionStorage not working
**Symptoms:** Tier selection lost after redirect

**Debug:**
1. Check console for storage logs
2. Verify not in private/incognito mode
3. Check browser settings allow storage
4. Try: `localStorage.setItem('test', 'value')` in console

**Fix:**
```javascript
// If sessionStorage blocked, use fallback
const storage = typeof window !== 'undefined' && window.sessionStorage
  ? sessionStorage
  : { getItem: () => null, setItem: () => {} };
```

---

### Issue: SSE not connecting
**Symptoms:** No progress updates, 404 in Network tab

**Debug:**
1. Check Network tab for actual error code
2. Verify project exists: `SELECT * FROM projects WHERE id = 'xxx'`
3. Check user owns project: `userId` matches session
4. Verify project status is IN_PROGRESS or PENDING

**Fix:**
```bash
# Restart dev server
npm run dev

# Check API route exists
ls app/api/project/\[id\]/stream/route.ts

# Check Prisma client
npx prisma generate
```

---

### Issue: Wrong badge colors
**Symptoms:** All badges blue, no gradient

**Debug:**
1. Inspect element → Check computed styles
2. Verify Tailwind config has gradients enabled
3. Clear Next.js cache

**Fix:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
npm run dev

# Check Tailwind config
cat tailwind.config.ts | grep gradient
```

---

### Issue: No emails sending
**Symptoms:** No emails received, no Postmark logs

**Debug:**
1. `printenv | grep POSTMARK` - Check API key set
2. Check Postmark dashboard for errors
3. Verify sender signature verified
4. Check spam folder

**Fix:**
```bash
# Restart server after adding env var
# In .env:
POSTMARK_API_KEY=your-actual-api-key

# Restart:
npm run dev

# Test manually:
curl -X POST "https://api.postmarkapp.com/email" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Postmark-Server-Token: YOUR_KEY" \
  -d '{
    "From": "sender@verified-domain.com",
    "To": "test@example.com",
    "Subject": "Test",
    "TextBody": "Test email"
  }'
```

---

## 📊 Performance Monitoring

### React DevTools Profiler
1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Click "Record" → Interact with dashboard
4. Stop recording → Review component render times

**Look for:**
- ⚠️ BIABProjectCard re-rendering too often (should only update every 2s)
- ⚠️ Expensive calculations blocking UI
- ✅ SSE updates causing minimal re-renders

### Memory Leaks
```javascript
// In console, after visiting dashboard and leaving:
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/stream'))
  .forEach(r => console.log('Active connection:', r.name));

// Should show no active connections after leaving page
```

---

## ✅ Final Pre-Production Checklist

- [ ] SessionStorage works in Chrome, Firefox, Safari
- [ ] SSE connects and streams data every 2 seconds
- [ ] Progress bars animate smoothly (60fps)
- [ ] Tier badges show correct colors:
  - [ ] Validation = Blue (#3b82f6)
  - [ ] Launch = Purple (#a855f7)
  - [ ] Turnkey = Gold gradient (#fbbf24 → #f97316)
- [ ] Emails send on project start
- [ ] Emails send on project completion
- [ ] Console shows no errors
- [ ] Network tab shows no failed requests
- [ ] Mobile responsive (test on 375px, 768px, 1024px)
- [ ] Keyboard navigation works
- [ ] Screen reader announces progress updates

**Ready for Production:** 🚀

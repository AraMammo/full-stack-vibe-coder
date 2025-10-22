# BIAB Frontend Testing Checklist

## Pre-Flight Checks

### 1. SessionStorage Persistence
**Test:** Does tier selection persist across page navigation?

**Steps:**
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab → **Session Storage** → `http://localhost:3000`
3. Navigate to `/pricing`
4. Click any tier CTA (e.g., "Launch My Business")
5. **Check:** Should see `selectedTier: "LAUNCH_BLUEPRINT"` in Session Storage
6. Refresh page
7. **Verify:** Value should persist (sessionStorage lasts for browser session)
8. Navigate to `/upload`
9. **Verify:** Selected tier appears at top of page

**Debug:**
```javascript
// In browser console:
sessionStorage.getItem('selectedTier')
// Should return: "VALIDATION_PACK", "LAUNCH_BLUEPRINT", or "TURNKEY_SYSTEM"

// To manually set:
sessionStorage.setItem('selectedTier', 'LAUNCH_BLUEPRINT')

// To clear:
sessionStorage.removeItem('selectedTier')
```

**Expected Result:** ✅ Tier persists until tab is closed

---

### 2. SSE Connection Check
**Test:** Is Server-Sent Events connecting for real-time updates?

**Steps:**
1. Open DevTools → **Network** tab
2. Filter by "stream" or "Fetch/XHR"
3. Navigate to `/dashboard` with an in-progress project
4. **Look for:** Request to `/api/project/[id]/stream`
5. **Status:** Should show **"pending"** or **200 (keep-alive)**
6. **Type:** Should be `text/event-stream`
7. Click the request → **Response** tab
8. **Verify:** Should see JSON data streaming every 2 seconds:
   ```
   data: {"projectId":"...","completedCount":3,"totalCount":16,"progress":18,...}

   data: {"projectId":"...","completedCount":4,"totalCount":16,"progress":25,...}
   ```

**Debug:**
```javascript
// In browser console on dashboard:
// Check if EventSource is active
const connections = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/stream'));
console.table(connections);

// Manual SSE test (replace PROJECT_ID):
const es = new EventSource('/api/project/PROJECT_ID/stream');
es.onmessage = (e) => console.log('SSE Data:', JSON.parse(e.data));
es.onerror = (e) => console.error('SSE Error:', e);
```

**Expected Result:**
- ✅ Connection status: **pending** (stays open)
- ✅ Data streams every 2 seconds
- ✅ Progress updates in real-time

**Troubleshooting:**
- **404 Error:** Project ID not found or user doesn't own project
- **401 Error:** User not authenticated
- **Connection closes immediately:** Project already completed or failed
- **No data streaming:** Check server logs for Prisma query errors

---

### 3. Tier Badge Colors
**Test:** Are tier badges displaying correct colors?

**Visual Check:**
| Tier | Badge Color | CSS Class | Expected |
|------|-------------|-----------|----------|
| **Validation Pack** | Blue | `bg-blue-500` | Bright blue |
| **Launch Blueprint** | Purple | `bg-purple-500` | Rich purple |
| **Turnkey System** | Gold gradient | `bg-gradient-to-r from-yellow-400 to-orange-500` | Yellow→Orange gradient |

**Component Locations:**
- **Dashboard cards:** `components/BIABProjectCard.tsx` line 27-36
- **Project detail:** `app/dashboard/project/[id]/page.tsx` line 18-28
- **Pricing page badges:** `app/pricing/page.tsx` line 186-192

**Debug in Browser:**
1. Inspect tier badge element
2. Check computed styles:
   ```css
   /* Validation Pack */
   background-color: rgb(59, 130, 246); /* blue-500 */

   /* Launch Blueprint */
   background-color: rgb(168, 85, 247); /* purple-500 */

   /* Turnkey System */
   background-image: linear-gradient(to right, rgb(251, 191, 36), rgb(249, 115, 22));
   ```

**Expected Result:**
- ✅ Validation: Blue background
- ✅ Launch: Purple background
- ✅ Turnkey: Yellow-to-orange gradient

**Fix if wrong:**
Check `tierConfig` object in each component matches this pattern:
```typescript
VALIDATION_PACK: { badgeColor: 'bg-blue-500' }
LAUNCH_BLUEPRINT: { badgeColor: 'bg-purple-500' }
TURNKEY_SYSTEM: { badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500' }
```

---

### 4. Postmark Email Sending
**Test:** Are project emails being sent?

**Email Triggers:**
1. **Project Started** - When BIAB orchestrator begins
2. **Project Complete** - When all prompts finish

**Server-Side Check:**

**Option A: Check Application Logs**
```bash
# In terminal where Next.js is running:
# Look for Postmark API calls

# You should see:
# ✅ "Sending project-started email to user@example.com"
# ✅ "Postmark API response: 200"
# ✅ "Sending project-complete email to user@example.com"
```

**Option B: Check Postmark Dashboard**
1. Log into https://account.postmarkapp.com
2. Go to **Servers** → Your server → **Message Streams** → **Outbound**
3. Check **Activity** tab
4. **Look for:** Recent emails with subjects:
   - "Your Business Package is Being Generated" (started)
   - "Your Business Package is Ready!" (complete)

**Option C: Check Email Integration Code**

Verify email service exists:
```bash
ls -la lib/email/
# Should show: postmark.ts, templates.ts
```

**Debug Test (if emails not sending):**

1. Check environment variable:
   ```bash
   echo $POSTMARK_API_KEY
   # Should return: your-postmark-api-key
   ```

2. Test email function manually:
   ```typescript
   // In a test API route:
   import { sendProjectStartedEmail } from '@/lib/email/postmark';

   await sendProjectStartedEmail({
     to: 'your-email@example.com',
     projectName: 'Test Project',
     tier: 'LAUNCH_BLUEPRINT',
     userName: 'Test User'
   });
   ```

3. Check Postmark error logs:
   ```bash
   # Common errors:
   # - 401: Invalid API key
   # - 422: Missing required fields (to, from, subject, body)
   # - 429: Rate limit exceeded
   ```

**Expected Result:**
- ✅ Email sent on project creation
- ✅ Email sent on project completion
- ✅ Postmark dashboard shows delivered emails
- ✅ User receives emails in inbox

**Troubleshooting:**
- **No emails sent:** Check `POSTMARK_API_KEY` is set in `.env`
- **Emails not received:** Check spam folder, verify Postmark sender signature
- **422 Error:** Check email template has all required fields
- **Server not in production mode:** Postmark may require production mode for sending

---

## End-to-End User Flow Test

### Full Integration Test

**Scenario:** User purchases Launch Blueprint and tracks progress

1. **Start:** Visit `/pricing`
   - ✅ All 3 tiers visible
   - ✅ "MOST POPULAR" badge on Launch Blueprint
   - ✅ FAQ accordion works

2. **Select Tier:** Click "Launch My Business"
   - ✅ Redirects to `/upload`
   - ✅ Session Storage shows `selectedTier: "LAUNCH_BLUEPRINT"`

3. **Upload Page:**
   - ✅ Purple "Selected Package" box appears
   - ✅ Shows "Launch Blueprint - $197"
   - ✅ "Change Tier" button works
   - ✅ Record and upload voice note

4. **Dashboard Redirect:**
   - ✅ Redirects to `/dashboard`
   - ✅ BIAB project card appears
   - ✅ Purple tier badge visible
   - ✅ Progress bar shows 0%
   - ✅ SSE connection in Network tab (pending)

5. **Real-Time Updates:**
   - ✅ Progress bar updates every 2 seconds
   - ✅ "Currently generating: [Section Name]" appears
   - ✅ Completed sections list grows
   - ✅ Progress percentage increases

6. **Project Detail:**
   - ✅ Click "View Details" → `/dashboard/project/[id]`
   - ✅ All 16 sections listed
   - ✅ In-progress section has spinner
   - ✅ Completed sections have green checkmark
   - ✅ "View Output" button works
   - ✅ Individual section download works

7. **Completion:**
   - ✅ Progress reaches 100%
   - ✅ Green "Your package is ready!" banner appears
   - ✅ "Download Complete Package" button visible
   - ✅ Email received (check inbox)

8. **Download:**
   - ✅ Click download → ZIP file downloads
   - ✅ ZIP contains all sections + logos + pitch deck

---

## Browser Console Debugging

### Add Console Logging for Development

**In BIABProjectCard.tsx** (line 60, in useEffect):
```typescript
eventSource.onmessage = (event) => {
  try {
    const data: ProgressData = JSON.parse(event.data);
    console.log('📊 SSE Update:', {
      progress: data.progress,
      completed: data.completedCount,
      total: data.totalCount,
      current: data.currentSection
    });
    setLiveProgress(data);
  } catch (error) {
    console.error('❌ Error parsing SSE data:', error);
  }
};

eventSource.onerror = (error) => {
  console.error('❌ SSE error:', error);
  console.log('Connection state:', eventSource.readyState);
  // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
  eventSource.close();
};
```

**In Upload Page** (after tier selection):
```typescript
const handleSelectTier = (tier: string) => {
  setSelectedTier(tier);
  setShowTierSelection(false);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('selectedTier', tier);
    console.log('✅ Tier selected and saved:', tier);
  }
};
```

---

## Common Issues & Solutions

### Issue 1: SSE Not Connecting
**Symptoms:** No progress updates, Network tab shows 404

**Solutions:**
1. Check project ID is valid: `SELECT * FROM projects WHERE id = '[id]'`
2. Verify user owns project: Check `userId` matches session
3. Check API route exists: `app/api/project/[id]/stream/route.ts`
4. Restart dev server: `npm run dev`

### Issue 2: SessionStorage Not Persisting
**Symptoms:** Tier selection lost on page refresh

**Solutions:**
1. Check browser doesn't have sessionStorage disabled
2. Verify not in incognito/private mode
3. Check for JavaScript errors in console
4. Ensure `useEffect` runs on mount

### Issue 3: Tier Badges Wrong Color
**Symptoms:** All badges same color or no gradient

**Solutions:**
1. Check Tailwind config includes gradient utilities
2. Verify `tierConfig` uses correct Tailwind classes
3. Clear browser cache and rebuild: `npm run build`
4. Check for CSS conflicts in global styles

### Issue 4: Emails Not Sending
**Symptoms:** No emails received, no Postmark logs

**Solutions:**
1. Verify `POSTMARK_API_KEY` in `.env` and restart server
2. Check Postmark dashboard for API errors
3. Verify sender signature is verified in Postmark
4. Check email functions are being called (add console.log)
5. Test with curl:
   ```bash
   curl "https://api.postmarkapp.com/email" \
     -X POST \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -H "X-Postmark-Server-Token: YOUR_API_KEY" \
     -d '{
       "From": "sender@example.com",
       "To": "receiver@example.com",
       "Subject": "Test",
       "TextBody": "Test email"
     }'
   ```

---

## Performance Checks

### SSE Performance
- **Connection count:** Should only have 1 EventSource per project card
- **Memory leaks:** Check EventSource closes on unmount
- **Polling frequency:** 2 seconds is optimal (not too fast, not too slow)

### React Rendering
- **Unnecessary re-renders:** Use React DevTools Profiler
- **State updates:** Only update when data actually changes
- **Component memoization:** Consider `useMemo` for expensive calculations

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Can navigate pricing cards with Tab
- [ ] Can select tier with Enter/Space
- [ ] Can navigate dashboard with keyboard only
- [ ] Focus visible on all interactive elements

### Screen Reader
- [ ] Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Status changes announced
- [ ] Button labels clear and descriptive

### Color Contrast
- [ ] All text meets WCAG 2.1 AA (4.5:1)
- [ ] Badge text readable on colored backgrounds

---

## Final Verification

Before marking complete, verify:
- [ ] All 3 tiers display correctly on `/pricing`
- [ ] Tier selection saves to sessionStorage
- [ ] Upload page shows selected tier
- [ ] Dashboard shows BIAB projects with live updates
- [ ] SSE connects and streams data every 2 seconds
- [ ] Project detail page shows all 16 sections
- [ ] Tier badges use correct colors (blue/purple/gold)
- [ ] Progress bars animate smoothly
- [ ] Download buttons appear when complete
- [ ] Emails send on project start and completion
- [ ] Mobile responsive on all pages
- [ ] No console errors

**Status:** Ready for Production ✅

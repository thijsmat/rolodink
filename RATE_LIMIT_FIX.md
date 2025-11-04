# ✅ Rate Limiting Fix - Testing Instructions

## Problem Fixed

**Issue**: HTTP 403 after ~50 requests instead of HTTP 429 rate limit

**Root Cause**: CORS conflict between `next.config.ts` (hardcoded headers) and route handlers (dynamic CORS)

**Fix**: Removed hardcoded CORS from `next.config.ts`, route handlers now fully control CORS

---

## Testing Rate Limiting

### Option 1: Test with Chrome Extension Origin (Production)

```bash
for i in {1..101}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Origin: chrome-extension://hidgijlndiamdghcfjloaihnakmllimd" \
    https://your-api.vercel.app/api/version)
  echo "Request $i: HTTP $HTTP_CODE"
  if [ "$HTTP_CODE" = "429" ]; then
    echo "✅ FIXED! Rate limiting works at request $i"
    break
  fi
done
```

**Expected**: Requests 1-100 = 200, Request 101 = 429 ✅

---

### Option 2: Test with localhost (Requires ALLOWED_ORIGINS env var)

**Set in Vercel Environment Variables**:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Then test:
```bash
for i in {1..101}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Origin: http://localhost:3000" \
    https://your-api.vercel.app/api/version)
  echo "Request $i: HTTP $HTTP_CODE"
  if [ "$HTTP_CODE" = "429" ]; then
    echo "✅ FIXED! Rate limiting works at request $i"
    break
  fi
done
```

---

### Option 3: Test without Origin header (Same-origin)

```bash
for i in {1..101}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    https://your-api.vercel.app/api/version)
  echo "Request $i: HTTP $HTTP_CODE"
  if [ "$HTTP_CODE" = "429" ]; then
    echo "✅ FIXED! Rate limiting works at request $i"
    break
  fi
done
```

---

## Verification Checklist

- [ ] Requests 1-100 return HTTP 200
- [ ] Request 101+ returns HTTP 429
- [ ] 429 response includes:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: <timestamp>`
  - `Retry-After: <seconds>`
  - `Access-Control-Allow-Origin: <origin>` (if origin whitelisted)
- [ ] No HTTP 403 errors
- [ ] CORS headers consistent across all responses

---

## What Changed

1. **next.config.ts**: Removed hardcoded CORS headers
2. **cors.ts**: Added `ALLOWED_ORIGINS` environment variable support
3. **All route handlers**: Already use `buildCorsHeaders()` correctly

---

## After Deployment

Wait for Vercel deployment to complete, then test with the commands above.

The rate limiting should now work correctly:
- ✅ Returns 429 after 100 requests (not 403)
- ✅ Proper CORS headers for whitelisted origins
- ✅ No conflicts between config and route handlers






# Force Cache Refresh for ETF Data

## Problem
The `prevClose` code fix is deployed, but the cache entry in the database was written before the deploy and doesn't expire until 20:04 UTC (~6 minutes from now). Until it expires, the old data without `prevClose` keeps being served.

## Solution
Add a `force` query parameter to the `fetch-etf-data` edge function that bypasses the cache check. Then trigger a single forced refresh.

### 1. Update `supabase/functions/fetch-etf-data/index.ts`
- Parse the request body for an optional `{ force: true }` flag
- When `force` is true, skip the cache check and fetch fresh data immediately

### 2. Trigger the refresh
- After deploying, call the function once with `{ force: true }` to populate the cache with fresh data including `prevClose`

### 3. ETFCard already ready
- `ETFCard.tsx` already uses `etf.prevClose` for the daily change calculation -- it just needs the data to arrive

Alternatively, we can simply wait ~6 minutes for the cache to naturally expire. The next request after 20:04 UTC will fetch fresh data with `prevClose` included.

**Recommended**: Add the `force` parameter -- it's useful for future manual refreshes too, not just this one-time fix.


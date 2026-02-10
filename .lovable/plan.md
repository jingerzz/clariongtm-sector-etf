

# Fix Empty News Feed + Update Footer with Live Timestamps

## Issue 1: Empty News Feed

**Root Cause:** The news cache currently contains `{ items: [] }` — an empty result got cached and is being served until it expires. The deployed edge function may also be out of sync with the code in the repo.

**Fix:**
- Clear the stale cache entry (`DELETE FROM cache WHERE key = 'etf-news'`)
- Redeploy the `fetch-etf-news` edge function to ensure the latest code is live
- Add a safeguard: if parsing returns zero items, do NOT cache the empty result — instead return an error so the next request retries
- Add `console.log` for the raw Perplexity response content to help debug future parsing failures

**File:** `supabase/functions/fetch-etf-news/index.ts`
- After parsing `newsItems`, add: if the array is empty, throw an error instead of caching an empty payload
- Add a debug log of the raw `content` string before parsing

---

## Issue 2: Footer Showing Static Intervals Instead of Real Timestamps

**Current:** `ETF data: 5min · News: 15min` (hardcoded intervals)
**Desired:** `ETF data: updated 3m ago · News: updated 12m ago` (live timestamps from each data source)

**Approach:**
- Import `useETFData` and `useMarketNews` hooks into `MarketFooter`
- Read `fetchedAt` from each hook's response data
- Display a relative time (e.g., "3m ago") for each, using a simple `timeAgo` helper (same pattern already used in `ETFGrid` and `NewsSidebar`)
- Show "Loading..." if data hasn't arrived yet

**File:** `src/components/MarketFooter.tsx`
- Remove the static interval text on the right side
- Replace with: `ETF data: {timeAgo} · News: {timeAgo}` using real `fetchedAt` values from each hook

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/fetch-etf-news/index.ts` | Add empty-result guard + debug logging |
| `src/components/MarketFooter.tsx` | Replace static intervals with live `fetchedAt` timestamps from hooks |

### MarketFooter new dependencies
- `useETFData` from `@/hooks/useETFData`
- `useMarketNews` from `@/hooks/useMarketNews`
- A local `timeAgo` helper (same pattern as ETFGrid)

### Edge function change detail
After parsing `newsItems` (line ~93), add:
```
if (newsItems.length === 0) {
  throw new Error("Parsed zero news items from Perplexity response");
}
```
This prevents caching empty results and lets the next cron/manual call retry successfully.


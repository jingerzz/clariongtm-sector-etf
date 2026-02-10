

# Remove Frontend Polling, Add Market-Aware Backend Schedules

## What Changes

### 1. Remove frontend polling from both hooks
Strip out `refetchInterval`, `staleTime`, and the `useMarketStatus` dependency from `useETFData.ts` and `useMarketNews.ts`. The hooks will fetch once on mount and only re-fetch when the user clicks the refresh button (which already calls `queryClient.invalidateQueries`).

### 2. Replace the two fixed pg_cron jobs with four market-aware cron jobs
The current cron jobs run at fixed intervals 24/7. Replace them with schedules that match the desired windows:

| Job | Schedule | When |
|-----|----------|------|
| ETF data (market open) | Every 5 min, Mon-Fri 9:30-15:55 ET | `*/5 14-20 * * 1-5` (UTC approximation) |
| ETF data (market closed) | Every 30 min, outside market hours | `*/30 0-13,21-23 * * *` + weekends |
| News (market open) | Every 15 min, Mon-Fri 9:30-15:55 ET | `*/15 14-20 * * 1-5` |
| News (market closed) | Every 60 min, outside market hours | `0 0-13,21-23 * * *` + weekends |

Note: ET is UTC-5 (EST) or UTC-4 (EDT). A simpler approach is to use two jobs per data type -- one for weekday business hours (UTC), one for everything else -- and let the edge function's cache TTL handle the boundary gracefully.

### 3. Clean up `useMarketStatus` usage
Since the hooks no longer need market status for polling, check if `useMarketStatus` is still used elsewhere (Header and MarketFooter use it for the status dot). If so, keep it. Just remove the import from the two data hooks.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useETFData.ts` | Remove `refetchInterval`, `staleTime`, and `useMarketStatus` import |
| `src/hooks/useMarketNews.ts` | Remove `refetchInterval`, `staleTime`, and `useMarketStatus` import |
| Database (SQL) | Drop existing 2 cron jobs, create 4 market-aware cron jobs |

## Technical Detail: Cron Schedules (UTC)

Assuming EST (UTC-5), market hours 9:30-16:00 ET = 14:30-21:00 UTC:

```text
-- ETF during market hours (every 5 min, Mon-Fri, 14:00-21:00 UTC)
*/5 14-20 * * 1-5

-- ETF outside market hours (every 30 min, all other times)
*/30 0-13,21-23 * * 1-5
*/30 * * * 0,6

-- News during market hours (every 15 min, Mon-Fri, 14:00-21:00 UTC)
*/15 14-20 * * 1-5

-- News outside market hours (every 60 min, all other times)
0 0-13,21-23 * * 1-5
0 * * * 0,6
```


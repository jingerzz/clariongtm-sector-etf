

# Pre-Populate Cache with Scheduled Jobs (Cron)

## What This Solves

Right now, the cache works reactively: the **first visitor** after a cache expiry still waits 3-5+ seconds while the edge function fetches fresh data. With scheduled cron jobs, the database is always pre-populated with fresh data — no visitor ever triggers an API call directly.

## How It Works

```text
Current (reactive cache):
  User visits --> Edge Function --> Cache expired? --> API call (slow) --> Update cache --> Respond

With cron (proactive cache):
  Cron job runs on schedule --> Edge Function --> API call --> Update cache
  User visits --> Edge Function --> Cache always fresh --> Instant response
```

## Implementation

### 1. Enable required database extensions

A migration to enable `pg_cron` and `pg_net`, which allow scheduled HTTP calls from within the database.

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### 2. Create cron jobs

Two scheduled jobs that call the existing edge functions on a fixed interval. These will be inserted via the SQL insert tool (not a migration, since they contain project-specific URLs and keys).

**ETF Data** -- every 5 minutes:
```text
cron.schedule('refresh-etf-data', '*/5 * * * *', ...)
  --> POST to fetch-etf-data edge function
```

**News** -- every 15 minutes:
```text
cron.schedule('refresh-etf-news', '*/15 * * * *', ...)
  --> POST to fetch-etf-news edge function
```

These intervals match market-open refresh rates. During off-hours the cache TTLs are longer (30min / 60min), so the cron will hit a still-valid cache and the edge function will return the cached data without calling external APIs — no wasted API calls.

### 3. No edge function changes needed

The existing cache logic already handles this correctly:
- If the cache is fresh, the function returns cached data (cron call is a no-op)
- If the cache is stale, the function fetches fresh data and updates the cache
- The cron just ensures the cache is refreshed proactively rather than waiting for a user visit

### 4. No frontend changes needed

The frontend already reads from the edge functions, which read from the cache. Everything stays the same.

## Technical Details

### Cron SQL (to be run via insert tool)

```sql
-- ETF data: refresh every 5 minutes
SELECT cron.schedule(
  'refresh-etf-data',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wbopkeaiwbacxmncaagf.supabase.co/functions/v1/fetch-etf-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon-key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- News: refresh every 15 minutes
SELECT cron.schedule(
  'refresh-etf-news',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wbopkeaiwbacxmncaagf.supabase.co/functions/v1/fetch-etf-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon-key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### API Usage Impact

At 5-minute intervals, ETF data generates ~288 calls/day to Yahoo Finance (12 tickers each = ~288 edge function calls, but many will be cache hits during off-hours). News at 15-minute intervals generates ~96 calls/day to Perplexity (again, many cache hits). Both well within rate limits.

## Files Changed

| Change | Method |
|--------|--------|
| Enable `pg_cron` + `pg_net` extensions | Database migration |
| Schedule two cron jobs | SQL insert tool (contains project-specific data) |

No edge function or frontend changes required.

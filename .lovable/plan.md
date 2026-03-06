

# Fix News Feed: Switch from Perplexity to Firecrawl

## Problem

Your Perplexity API quota is exhausted, causing the news sidebar to fail with 401 errors. This is the same problem you solved on AI Datacenter Pulse by switching to Firecrawl's search API.

## Solution

Rewrite `fetch-etf-news` to use Firecrawl search (same pattern as AI Datacenter Pulse), and link your existing Firecrawl connection to this project.

## Steps

1. **Link Firecrawl connector** -- You already have a Firecrawl connection in your workspace (`std_01kk0d8mpcfh9rcvzw02rwcr1p`). It just needs to be linked to this project so the `FIRECRAWL_API_KEY` secret is available.

2. **Rewrite `supabase/functions/fetch-etf-news/index.ts`** -- Replace the Perplexity logic with Firecrawl search, mirroring the AI Datacenter Pulse approach:
   - Run multiple parallel searches with finance-focused queries (e.g. "sector ETF market moves today", "Federal Reserve interest rates economy", "stock market commodities bonds")
   - Use `tbs: "qdr:d"` for last-24-hour results
   - Deduplicate by URL, take top 8
   - Extract domain name as source
   - Preserve the existing response shape (`{ fetchedAt, items: [{ id, headline, summary, source, url, timestamp }] }`) so no frontend changes are needed
   - Keep the existing cache logic (15-min TTL, `etf-news` cache key) and auth header validation

No frontend changes required -- the `NewsSidebar` and `useMarketNews` hook already consume this exact response format.

## Technical Details

- Firecrawl search returns `{ data: [{ url, title, description }] }` -- map `title` to `headline`, `description` to `summary`, extract domain for `source`
- Search queries tailored for financial/market news coverage: macro data, Fed actions, sector trends, commodities, geopolitics
- 3 parallel searches with `limit: 4` each gives ~12 results before dedup, narrowed to top 8


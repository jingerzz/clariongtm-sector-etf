

# Updated Plan: Switch News to Lovable AI + Daily Refresh

## What Changed from Previous Plan

- **Drop Firecrawl** for news -- replace with Lovable AI (`google/gemini-2.5-flash`) via the AI gateway, same pattern as Datacenter Pulse's `fetch-datacenter-news`
- **Change cache TTL from 15 minutes to 24 hours** for news
- Firecrawl connector stays linked (still used if needed elsewhere), but the news function no longer depends on it

## Steps

### 1. Rewrite `supabase/functions/fetch-etf-news/index.ts`

Replace the Firecrawl search logic with a Lovable AI prompt, mirroring the Datacenter Pulse approach:

- Use `LOVABLE_API_KEY` (already available) to call `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-2.5-flash` with `temperature: 0.1`
- Prompt asks for 8 market-moving stories about sector ETFs, macro economy, Fed policy, commodities, bonds, and geopolitics
- Response format: JSON with `stories[]` containing `headline`, `summary`, `source`, `url`, `hoursAgo`
- Map AI response to existing schema (`id`, `headline`, `summary`, `source`, `url`, `timestamp`)
- Cache TTL: **24 hours** (`CACHE_TTL_MS = 24 * 60 * 60 * 1000`)
- Fallback to stale cache if AI call fails or response can't be parsed
- Parse JSON with regex fallback to handle possible markdown wrapping

### 2. Update `src/hooks/useMarketNews.ts`

- Set `staleTime` to match the 24-hour refresh (no refetching within a session)

### 3. Update `src/components/NewsSidebar.tsx`

- Add `hoursAgo` field support to `timeAgo` display (AI returns `hoursAgo` instead of ISO timestamp)

No new secrets, no new edge functions, no database changes needed. The `LOVABLE_API_KEY` is already configured.

## Technical Details

- The AI gateway is free (uses built-in Lovable AI credits)
- Note: AI-generated news URLs may not always be perfectly valid links (unlike Firecrawl's search results which are real URLs). The sidebar already handles missing URLs gracefully with `cursor-default` styling.
- The 24-hour cache means the function is called at most once per day per cold start. The existing `pg_cron` background refresh (if configured) or first visitor of the day triggers the refresh.


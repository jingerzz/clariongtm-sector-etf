
# Rebuild the Sector ETF Tracker Dashboard

The edge functions and database cache are intact and working. The frontend components were lost. This plan recreates the full UI from the screenshot, reading data directly from the backend.

## Overview

Rebuild the entire dashboard: a dark trading-terminal interface with a 4-column ETF card grid (~70% width), a scrollable news sidebar (~30% width), a header, and a footer with market status.

## Files to Create/Modify

### 1. Install missing dependency
- Add `@supabase/supabase-js` (fixes the current build error)

### 2. Create edge function files
The deployed functions still work but their source code is missing. Recreate:
- `supabase/functions/fetch-etf-data/index.ts` -- reads from `cache` table (key `etf-data`), falls back to Yahoo Finance API
- `supabase/functions/fetch-etf-news/index.ts` -- reads from `cache` table (key `etf-news`), falls back to Perplexity API

### 3. Create frontend data hooks
- `src/hooks/useETFData.ts` -- React Query hook calling `fetch-etf-data` edge function, returns array of ETF objects with `fetchedAt` timestamp. Polls every 5 min during market hours, 30 min otherwise.
- `src/hooks/useMarketNews.ts` -- React Query hook calling `fetch-etf-news` edge function, returns array of news items with `fetchedAt` timestamp. Polls every 15 min during market hours, 60 min otherwise.
- `src/hooks/useMarketStatus.ts` -- Pure client-side hook returning whether US markets are open (Mon-Fri 9:30-16:00 ET).

### 4. Create UI components
- `src/components/Header.tsx` -- "SECTOR ETF TRACKER" title with green dot indicator and refresh button
- `src/components/ETFCard.tsx` -- Single ETF tile showing: ticker, sector label, price, daily change, 200/50/9-day MAs with trend arrows, RSI with color-coded label, volume with % change, fear/greed progress bar with score
- `src/components/ETFGrid.tsx` -- 4-column responsive grid of ETFCard components, with "Updated..." timestamp
- `src/components/NewsSidebar.tsx` -- Right sidebar with "MARKET NEWS" header, scrollable list of news cards (headline, summary, source, relative timestamp)
- `src/components/MarketFooter.tsx` -- Footer bar showing market open/closed status, data refresh intervals

### 5. Update `src/pages/Index.tsx`
- Compose all components into the dashboard layout
- Dark background, full-viewport layout
- Left section (~70%): Header + ETFGrid
- Right section (~30%): NewsSidebar
- Bottom: MarketFooter

### 6. Update `src/index.css`
- Ensure dark mode is the default (add `dark` class to root or set dark theme variables as default)

## Data Shape Reference

**ETF data** (from cache key `etf-data`): array of objects with fields:
`ticker, name, sector, price, ma200, ma50, ma9, rsi, volume, avgVolume, fearGreedScore, fearGreedLabel`

**News data** (from cache key `etf-news`): array of objects with fields:
`id, headline, summary, source, url, timestamp`

Both endpoints also return a `fetchedAt` ISO timestamp for the "Updated..." label.

## Visual Design Details

- Dark background (`#0a0a0a` or similar very dark gray)
- Cards with dark borders and subtle backgrounds
- Green for positive values/bullish, red for negative/bearish, amber/yellow for neutral
- Fear/Greed bar: gradient from red (fear) through yellow (neutral) to green (greed)
- Monospace font for the header title
- Compact, information-dense layout matching the terminal aesthetic from the screenshot

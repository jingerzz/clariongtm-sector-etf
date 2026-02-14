

# Make Your Dashboard Readable by LLM Agents

## The Problem

Your app is a client-side React SPA. When ChatGPT, Perplexity, or other LLM agents try to read your site, they get an empty `<div id="root"></div>` -- no data, no prices, no news.

## The Solution: Two Complementary Approaches

### 1. Add an `llms.txt` file (the "robots.txt for AI")

A new standard (`llmstxt.org`) that LLM agents check first when visiting a site. We'll serve a dynamically generated `llms.txt` at your site's root that includes:

- Site description and purpose
- Current ETF prices, moving averages, RSI, fear/greed scores
- Latest market news headlines with source links
- A link to the JSON API for programmatic access

This is generated live from your cached data, so agents always get fresh numbers.

### 2. Create a public JSON API endpoint

A dedicated edge function (`/functions/v1/site-summary`) that returns all dashboard data in clean, structured JSON. This lets more sophisticated agents or tools fetch your data programmatically.

## How It Works

```text
LLM Agent visits clariongtm-sector-etf.lovable.app
        |
        v
  Checks /llms.txt
        |
        v
  Gets structured markdown with:
  - All ETF tickers, prices, RSI, trend signals
  - Market news headlines + summaries
  - Link to JSON API for raw data
```

## What Gets Created

| Item | Description |
|------|-------------|
| `supabase/functions/llms-txt/index.ts` | Edge function that reads cached ETF + news data from the database and renders a markdown `llms.txt` response |
| `supabase/functions/site-summary/index.ts` | Edge function returning the same data as structured JSON |
| Update `supabase/config.toml` | Register both new functions (no JWT required -- public endpoints) |

## Example `llms.txt` Output

```text
# ClarionGTM Sector ETF Dashboard

> Real-time sector ETF performance tracking and market news dashboard.

## Current ETF Data (as of 2026-02-14T15:30:00Z)

- [XLK] Technology: $215.43 | RSI 62.1 (Neutral) | 50d MA $210.12 (Above) | F/G 58 Greed
- [XLF] Financials: $42.18 | RSI 71.3 (Overbought) | 50d MA $40.55 (Above) | F/G 65 Greed
- ...

## Market News

- Fed Holds Rates Steady, Signals Patience on Cuts (Reuters)
- China Trade Data Beats Expectations (Bloomberg)
- ...

## API

- [JSON API](https://wbopkeaiwbacxmncaagf.supabase.co/functions/v1/site-summary): Full structured data
```

## Technical Details

- Both edge functions read from the existing `cache` table (keys `etf-data` and `etf-news`) -- no extra API calls
- No authentication required -- these are public, read-only endpoints
- The `llms.txt` function computes the same derived values shown on the dashboard (daily change %, trend direction, RSI label)
- Response includes `Cache-Control` headers to avoid excessive hits

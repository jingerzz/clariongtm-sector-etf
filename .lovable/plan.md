

# Broaden News Feed Prompt

## What's Changing

The current Perplexity prompt is too narrowly focused on ETFs. Both the system and user messages will be updated to request a wider range of financial and market news.

## Updated Prompts

**System message (before):**
> "...the 12 most important market/ETF news stories from today..."

**System message (after):**
> "...the 12 most important financial and market news stories from today. Cover a mix of: macroeconomic data, Federal Reserve and interest rate developments, geopolitical events affecting markets, major equity moves, sector trends, commodities, bonds, and ETF flows..."

**User message (before):**
> "What are the top market and sector ETF news stories today? Focus on US equity sectors, commodities, bonds, and macro events affecting ETFs."

**User message (after):**
> "What are today's top financial and market news stories? Include macroeconomic indicators, Fed/central bank actions, geopolitical developments, major stock moves, sector rotation, commodities, bonds, and notable ETF flows."

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/fetch-etf-news/index.ts` | Update system and user prompt text (lines 51 and 55-56) |

After updating the prompts, the edge function will be redeployed and the cache cleared so a fresh fetch picks up the broader coverage.


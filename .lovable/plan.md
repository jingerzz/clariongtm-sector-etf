

# Add XHB, XME, XSD, KRE to the Dashboard

## Changes

A single file needs updating:

**`supabase/functions/fetch-etf-data/index.ts`** -- Add four new entries to the `TICKERS` array:

| Ticker | Name | Sector Label |
|--------|------|-------------|
| XHB | SPDR S&P Homebuilders | Homebuilders |
| XME | SPDR S&P Metals & Mining | Metals/Mining |
| XSD | SPDR S&P Semiconductor | Semiconductors |
| KRE | SPDR S&P Regional Banking | Reg. Banking |

These will automatically:
- Get fetched alongside the existing 12 tickers (same Yahoo Finance call)
- Have RSI, moving averages, and Fear/Greed scores calculated
- Appear as new cards in the ETF grid (the frontend maps over `data.items` dynamically)
- Show up in the `llms.txt` and `site-summary` endpoints

No frontend changes needed -- the grid already renders whatever items the API returns.

## Technical Details

- The edge function's cache key (`etf-data`) stays the same; the next cache miss will fetch all 16 tickers and store the updated payload
- The grid will expand from 12 to 16 cards, fitting naturally into the existing 4-column layout (4 full rows on desktop)




# Fix Daily Change Calculation

## Problem
`ETFCard.tsx` calculates "daily change" as `(price - ma9) / ma9` — deviation from the 9-day moving average, not actual day-over-day change. This produces wrong percentages.

## Solution

### 1. Edge function: add `prevClose` field
In `supabase/functions/fetch-etf-data/index.ts`, extract the second-to-last close from the daily closes array and return it as `prevClose`:
```ts
const prevClose = closes.length >= 2 ? closes[closes.length - 2] : price;
```
Add `prevClose` to the returned object.

### 2. Hook: add `prevClose` to `ETFItem` type
In `src/hooks/useETFData.ts`, add `prevClose: number` to the `ETFItem` interface.

### 3. Card: use real daily change
In `src/components/ETFCard.tsx`, replace the calculation:
```ts
// Before
const dailyChange = ((etf.price - etf.ma9) / etf.ma9) * 100;

// After
const dailyChange = ((etf.price - etf.prevClose) / etf.prevClose) * 100;
```

Three small edits, no new files.


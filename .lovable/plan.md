

# Separate ETF Header Into Two Rows

## Problem
The ticker, sector label, price, and percent change are all crammed into a single row, making cards hard to read on smaller viewports. For example, "XLE ENERGY $53.58 +2.86%" appears as one dense line.

## Solution
Split the current single-row header into two distinct rows:

**Row 1:** Ticker and sector description (left-aligned)
**Row 2:** Price and percent change (left-aligned, below the name)

### Before
```text
XLE ENERGY                    $53.58 +2.86%
```

### After
```text
XLE  ENERGY
$53.58  +2.86%
```

## File Changed

`src/components/ETFCard.tsx` -- Replace the header `<div>` block (the `flex items-center justify-between` wrapper) with two stacked rows:

1. First row: ticker + sector label
2. Second row: price + percent change, with a small top margin (`mt-1`)

No other files are affected.


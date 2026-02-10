

# Simplify ETF Cards for Better Readability

## Problem
The ETF cards are too information-dense, especially the 3-column moving average row which crams three values with trend icons into a tight space. This makes them hard to scan quickly across browsers.

## Changes

### 1. `src/components/ETFCard.tsx` — Simplify to single 50-day MA
- **Remove** the 3-column MA grid entirely
- **Replace** with a single inline row showing just the 50-day MA value and its trend icon
- This frees up vertical space and eliminates the most cramped section of the card
- The 50-day MA is the most commonly referenced moving average for intermediate trend analysis, making it the best single choice

**Before (3 rows, cramped):**
```text
200d 542.31 ↑  50d 538.10 ↑  9d 540.22 →
```

**After (1 clean line):**
```text
50d MA  538.10  ↑
```

### 2. `src/components/ETFCard.tsx` — Increase base font sizes slightly
- Bump the RSI/Volume row from `text-[11px]` to `text-xs` (12px) for better legibility
- Bump the Fear/Greed label from `text-[9px]` to `text-[10px]`

### 3. `src/components/ETFCard.tsx` — Add slightly more padding
- Increase card padding from `p-3` to `p-4` for more breathing room

## Technical Details

Only one file changes: `src/components/ETFCard.tsx`

| Section | Current | Proposed |
|---------|---------|----------|
| Moving Averages | 3-column grid (200d, 50d, 9d) | Single row: 50d MA only |
| Card padding | `p-3` | `p-4` |
| RSI/Vol font | `text-[11px]` | `text-xs` |
| F/G label font | `text-[9px]` | `text-[10px]` |


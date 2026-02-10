
# Fix Spacing and Viewability Issues

## Problems Found

1. **`App.css` constrains the layout**: The `#root` styles set `max-width: 1280px`, `padding: 2rem`, and `text-align: center` -- leftover Vite boilerplate. This adds unwanted padding around the dashboard and caps its width, wasting screen space on large monitors.

2. **Mobile: no responsive stacking**: The main content area uses `flex` with a sidebar at `w-full lg:w-80`, but on small screens both the ETF grid (`flex-1`) and sidebar fight for space. The news sidebar takes over and the ETF grid becomes invisible. The layout needs to stack vertically on mobile (grid on top, news below) or use a tabbed view.

3. **ETF card text cramping**: The 3-column MA row (`grid-cols-3`) gets tight on smaller cards, and the `text-[11px]` / `text-[10px]` sizes may clip on some screens. Minor spacing tweaks needed.

## Changes

### 1. Clean up `App.css`
Remove the `#root` block entirely (or replace with full-width styles). This eliminates the max-width cap and the 2rem padding that push the dashboard inward.

### 2. Make `Index.tsx` layout responsive
- On large screens (`lg+`): keep the current side-by-side flex layout (ETF grid + news sidebar)
- On small screens (`< lg`): stack vertically -- ETF grid first, then news section below with a collapsible or scrollable area

### 3. Update `NewsSidebar.tsx` for mobile
- Remove `w-full` default (which makes it take 100% on mobile and push the grid out)
- On mobile: render as a full-width section below the grid with a max height and scroll
- On desktop: keep the fixed `lg:w-80 xl:w-96` sidebar behavior

### 4. Minor ETF card spacing
- Add slightly more padding between MA values in the 3-column grid
- Ensure the Fear/Greed label row has a small bottom margin so cards don't feel clipped

## Technical Details

| File | Change |
|------|--------|
| `src/App.css` | Remove `#root` max-width/padding/text-align rules |
| `src/pages/Index.tsx` | Change inner `flex` to `flex-col lg:flex-row` for responsive stacking |
| `src/components/NewsSidebar.tsx` | Replace `w-full lg:w-80` with responsive classes; add max-h on mobile |
| `src/components/ETFCard.tsx` | Add `gap-2` to MA grid, minor bottom padding |
| `src/components/ETFGrid.tsx` | Ensure grid scrolls properly within its container on both layouts |

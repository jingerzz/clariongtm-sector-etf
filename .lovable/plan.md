# Improve Market News: Accurate Links + Time Filtering

## Problem 1: Incorrect News URLs

**Current behavior:** Citations from Perplexity are assigned by array index (`citations[0]` goes to news item 0, `citations[1]` to item 1, etc.). But Perplexity's citations array is a flat list of ALL sources used across the entire response -- they don't correspond 1:1 with the 8 news items. This leads to mismatched or missing links.

**Fix:** Change the system prompt to instruct Perplexity to include citation markers (e.g., `[1]`, `[2]`) in each headline or summary. Then parse those markers and map them to the correct URL from the `citations` array. This gives each news item its actual source link.

### Implementation detail

- Update the system prompt to: `"...After each headline, include the citation number in brackets like [1]. I will use these to map to source URLs."`
- After parsing `newsItems`, scan each item's headline/summary for `[N]` patterns
- Look up `citations[N-1]` (Perplexity citations are 1-indexed in text, 0-indexed in the array)
- Strip the `[N]` marker from the display text so it looks clean in the UI

---

## Problem 2: No Time Restriction on Search

**Current behavior:** The prompt says "today" but there's no API-level enforcement. Perplexity could return older articles.

**Fix:** Add `search_recency_filter: "day"` to the Perplexity API request body. This tells Perplexity to only search content from the last 24-36 hours, ensuring the news feed stays current.  Grab at least 12 articles and then check + remove duplicates + show the best 8.  If less than 8 that is OKAY.  

---

## Technical Details

### File Modified


| File                                         | Change                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `supabase/functions/fetch-etf-news/index.ts` | Update prompt for citation markers, add citation parsing logic, add `search_recency_filter` |


### Prompt change (system message)

```
Before: "Do NOT include any URLs -- I will get those from citations."
After:  "After each headline, include the citation number in square brackets like [1]. Do NOT include URLs. Format: [{"headline":"Headline text [1]","summary":"...","source":"..."}]"
```

### Citation parsing (replaces the simple `citations[i]` mapping)

```
// For each news item, extract [N] from headline, look up citations[N-1]
const citationMatch = item.headline.match(/\[(\d+)\]/);
const citationIndex = citationMatch ? parseInt(citationMatch[1]) - 1 : -1;
const url = citationIndex >= 0 && citationIndex < citations.length
  ? citations[citationIndex] : "";
// Strip the [N] marker from the headline for clean display
const cleanHeadline = item.headline.replace(/\s*\[\d+\]/, "");
```

### API parameter addition

```
search_recency_filter: "day"
```

Added to the request body alongside existing parameters like `search_domain_filter` and `temperature`.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_KEY = "etf-news";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function firecrawlSearch(apiKey: string, query: string, limit = 4) {
  const response = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
      tbs: "qdr:d",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firecrawl search error [${response.status}]: ${errText}`);
  }

  return response.json();
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const apiKeyHeader = req.headers.get("apikey") || "";

    if (!authHeader && !apiKeyHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await supabase
      .from("cache")
      .select("data, fetched_at, expires_at")
      .eq("key", CACHE_KEY)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    // Run 3 parallel searches with finance-focused queries
    const queries = [
      "sector ETF stock market moves today",
      "Federal Reserve interest rates economy news today",
      "commodities bonds geopolitical market news today",
    ];

    const results = await Promise.all(
      queries.map((q) => firecrawlSearch(apiKey, q, 4))
    );

    // Flatten and deduplicate by URL
    const seen = new Set<string>();
    const allItems: Array<{ url: string; title: string; description: string }> = [];

    for (const result of results) {
      const data = result.data || [];
      for (const item of data) {
        if (item.url && !seen.has(item.url)) {
          seen.add(item.url);
          allItems.push(item);
        }
      }
    }

    if (allItems.length === 0) {
      throw new Error("No news items returned from Firecrawl search");
    }

    const now = new Date().toISOString();
    const topItems = allItems.slice(0, 8);

    const items = topItems.map((item, i) => ({
      id: `news-${i}`,
      headline: (item.title || "").trim(),
      summary: (item.description || "").trim(),
      source: extractDomain(item.url),
      url: item.url,
      timestamp: now,
    }));

    const payload = { fetchedAt: now, items };

    // Upsert cache
    await supabase.from("cache").upsert({
      key: CACHE_KEY,
      data: payload,
      fetched_at: now,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-etf-news error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

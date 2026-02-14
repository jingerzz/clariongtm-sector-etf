const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_KEY = "etf-news";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate the request has a valid apikey or authorization header
    const authHeader = req.headers.get("authorization") || "";
    const apiKeyHeader = req.headers.get("apikey") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

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

    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are a financial news aggregator. Return ONLY a JSON array of the 12 most important financial and market news stories from today. Cover a mix of: macroeconomic data, Federal Reserve and interest rate developments, geopolitical events affecting markets, major equity moves, sector trends, commodities, bonds, and ETF flows. Each item must have: headline, summary (1-2 sentences), source (publication name). After each headline, include the citation number in square brackets like [1]. Do NOT include URLs. Format: [{"headline":"Headline text [1]","summary":"...","source":"..."}]`,
          },
          {
            role: "user",
            content:
              "What are today's top financial and market news stories? Include macroeconomic indicators, Fed/central bank actions, geopolitical developments, major stock moves, sector rotation, commodities, bonds, and notable ETF flows.",
          },
        ],
        search_recency_filter: "day",
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Perplexity API error [${response.status}]: ${errText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "[]";
    const citations: string[] = result.citations || [];

    console.log("Raw Perplexity content:", content);
    console.log("Citations array:", JSON.stringify(citations));

    // Parse the JSON array from the response
    let newsItems: Array<{ headline: string; summary: string; source: string }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse news JSON:", content);
      newsItems = [];
    }

    if (newsItems.length === 0) {
      throw new Error("Parsed zero news items from Perplexity response");
    }

    const now = new Date().toISOString();
    // Deduplicate by headline similarity and map citations
    const seen = new Set<string>();
    const dedupedItems: typeof newsItems = [];
    for (const item of newsItems) {
      const key = item.headline.replace(/\s*\[\d+\]/g, "").toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        dedupedItems.push(item);
      }
    }

    // Take best 8
    const topItems = dedupedItems.slice(0, 8);

    const items = topItems.map(
      (item: { headline: string; summary: string; source: string }, i: number) => {
        // Extract citation marker [N] from headline
        const citationMatch = item.headline.match(/\[(\d+)\]/);
        const citationIndex = citationMatch ? parseInt(citationMatch[1]) - 1 : -1;
        const url = citationIndex >= 0 && citationIndex < citations.length
          ? citations[citationIndex] : "";
        // Strip [N] marker for clean display
        const cleanHeadline = item.headline.replace(/\s*\[\d+\]/g, "").trim();

        return {
          id: `news-${i}`,
          headline: cleanHeadline,
          summary: item.summary.replace(/\s*\[\d+\]/g, "").trim(),
          source: item.source,
          url,
          timestamp: now,
        };
      }
    );

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

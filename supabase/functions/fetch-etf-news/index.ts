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
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a financial news aggregator. Return ONLY a JSON array of the 8 most important market/ETF news stories from today. Each item must have: headline, summary (1-2 sentences), source (publication name). Do NOT include any URLs — I will get those from citations. Format: [{"headline":"...","summary":"...","source":"..."}]`,
          },
          {
            role: "user",
            content:
              "What are the top market and sector ETF news stories today? Focus on US equity sectors, commodities, bonds, and macro events affecting ETFs.",
          },
        ],
        search_domain_filter: [
          "reuters.com",
          "cnbc.com",
          "bloomberg.com",
          "wsj.com",
          "marketwatch.com",
          "finance.yahoo.com",
          "barrons.com",
          "ft.com",
        ],
        temperature: 0.1,
        max_tokens: 2000,
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
    const items = newsItems.map(
      (item: { headline: string; summary: string; source: string }, i: number) => ({
        id: `news-${i}`,
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        // Use citation URLs from Perplexity's search results
        url: citations[i] || "",
        timestamp: now,
      })
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_KEY = "etf-news";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content:
                "You are a financial news analyst. Return ONLY valid JSON, no markdown fences.",
            },
            {
              role: "user",
              content: `Today is ${today}. Generate 8 of the most important market-moving news stories from today covering: sector ETFs, stock market moves, Federal Reserve / interest rate decisions, macroeconomic data, commodities, bonds, and geopolitical events affecting markets.

Return a JSON object with this exact structure:
{
  "stories": [
    {
      "headline": "Short punchy headline (max 80 chars)",
      "summary": "1-2 sentence summary of the story and its market impact",
      "source": "Likely source outlet (e.g. Reuters, Bloomberg, CNBC)",
      "url": "",
      "hoursAgo": 2
    }
  ]
}

Make stories realistic, specific, and based on current market conditions for ${today}. Include specific numbers, percentages, and ticker symbols where relevant. Set hoursAgo to a realistic number (1-12) for when each story likely broke today. Leave url as empty string.`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      // Fallback to stale cache if available
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error [${response.status}]`);
    }

    const aiResult = await response.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON, handling possible markdown wrapping
    let stories: Array<{
      headline: string;
      summary: string;
      source: string;
      url: string;
      hoursAgo: number;
    }> = [];

    try {
      let jsonStr = rawContent;
      const fenceMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1];
      }
      const parsed = JSON.parse(jsonStr.trim());
      stories = parsed.stories || [];
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr, rawContent);
      // Fallback to stale cache
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to parse AI news response");
    }

    const now = new Date().toISOString();

    const items = stories.slice(0, 8).map((story, i) => ({
      id: `news-${i}`,
      headline: (story.headline || "").trim(),
      summary: (story.summary || "").trim(),
      source: (story.source || "Unknown").trim(),
      url: (story.url || "").trim(),
      timestamp: now,
      hoursAgo: story.hoursAgo || 0,
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

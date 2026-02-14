import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function rsiLabel(rsi: number): string {
  if (rsi >= 70) return "Overbought";
  if (rsi <= 30) return "Oversold";
  return "Neutral";
}

function trendLabel(price: number, ma: number): string {
  if (price > ma * 1.005) return "Above";
  if (price < ma * 0.995) return "Below";
  return "At";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch both caches in parallel
    const [etfResult, newsResult] = await Promise.all([
      supabase.from("cache").select("data, fetched_at").eq("key", "etf-data").single(),
      supabase.from("cache").select("data, fetched_at").eq("key", "etf-news").single(),
    ]);

    const now = new Date().toISOString();
    const etfData = etfResult.data?.data as any;
    const newsData = newsResult.data?.data as any;

    let md = `# ClarionGTM Sector ETF Dashboard

> Real-time sector ETF performance tracking, technical analysis, and market news.
> Website: https://clariongtm-sector-etf.lovable.app

`;

    // ETF section
    if (etfData && Array.isArray(etfData)) {
      const fetchedAt = etfResult.data?.fetched_at || now;
      md += `## Current ETF Data (as of ${fetchedAt})\n\n`;
      for (const etf of etfData) {
        const dailyChange = ((etf.price - etf.ma9) / etf.ma9 * 100).toFixed(2);
        const sign = parseFloat(dailyChange) >= 0 ? "+" : "";
        md += `- [${etf.ticker}] ${etf.name}: $${etf.price.toFixed(2)} (${sign}${dailyChange}%) | RSI ${etf.rsi.toFixed(1)} (${rsiLabel(etf.rsi)}) | 50d MA $${etf.ma50.toFixed(2)} (${trendLabel(etf.price, etf.ma50)}) | F/G ${etf.fearGreedScore} ${etf.fearGreedLabel}\n`;
      }
    } else if (etfData?.items && Array.isArray(etfData.items)) {
      const fetchedAt = etfData.fetchedAt || etfResult.data?.fetched_at || now;
      md += `## Current ETF Data (as of ${fetchedAt})\n\n`;
      for (const etf of etfData.items) {
        const dailyChange = ((etf.price - etf.ma9) / etf.ma9 * 100).toFixed(2);
        const sign = parseFloat(dailyChange) >= 0 ? "+" : "";
        md += `- [${etf.ticker}] ${etf.name}: $${etf.price.toFixed(2)} (${sign}${dailyChange}%) | RSI ${etf.rsi.toFixed(1)} (${rsiLabel(etf.rsi)}) | 50d MA $${etf.ma50.toFixed(2)} (${trendLabel(etf.price, etf.ma50)}) | F/G ${etf.fearGreedScore} ${etf.fearGreedLabel}\n`;
      }
    } else {
      md += `## Current ETF Data\n\nNo data currently available.\n`;
    }

    md += `\n`;

    // News section
    if (newsData?.items && Array.isArray(newsData.items)) {
      md += `## Market News (as of ${newsData.fetchedAt || now})\n\n`;
      for (const item of newsData.items) {
        const urlPart = item.url ? ` — ${item.url}` : "";
        md += `- ${item.headline} (${item.source})${urlPart}\n  ${item.summary}\n`;
      }
    } else {
      md += `## Market News\n\nNo news currently available.\n`;
    }

    md += `\n## API\n\n`;
    md += `- [JSON API](${supabaseUrl}/functions/v1/site-summary): Full structured data in JSON format\n`;

    return new Response(md, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("llms-txt error:", error);
    return new Response("# Error\n\nUnable to generate llms.txt at this time.", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
});

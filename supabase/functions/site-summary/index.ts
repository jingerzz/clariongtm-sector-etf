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

    const [etfResult, newsResult] = await Promise.all([
      supabase.from("cache").select("data, fetched_at").eq("key", "etf-data").single(),
      supabase.from("cache").select("data, fetched_at").eq("key", "etf-news").single(),
    ]);

    const etfRaw = etfResult.data?.data as any;
    const newsRaw = newsResult.data?.data as any;

    // Normalize ETF items (handle both array and {items:[]} shapes)
    const etfItems = Array.isArray(etfRaw) ? etfRaw : (etfRaw?.items || []);
    const etfFetchedAt = etfRaw?.fetchedAt || etfResult.data?.fetched_at || null;

    const enrichedETFs = etfItems.map((etf: any) => ({
      ticker: etf.ticker,
      name: etf.name,
      sector: etf.sector,
      price: etf.price,
      dailyChangePct: parseFloat(((etf.price - etf.ma9) / etf.ma9 * 100).toFixed(2)),
      ma9: etf.ma9,
      ma50: etf.ma50,
      ma200: etf.ma200,
      ma50Trend: trendLabel(etf.price, etf.ma50),
      ma200Trend: trendLabel(etf.price, etf.ma200),
      rsi: parseFloat(etf.rsi.toFixed(2)),
      rsiLabel: rsiLabel(etf.rsi),
      fearGreedScore: etf.fearGreedScore,
      fearGreedLabel: etf.fearGreedLabel,
    }));

    const newsItems = newsRaw?.items || [];
    const newsFetchedAt = newsRaw?.fetchedAt || newsResult.data?.fetched_at || null;

    const summary = {
      site: "ClarionGTM Sector ETF Dashboard",
      description: "Real-time sector ETF performance tracking, technical analysis, and market news.",
      url: "https://clariongtm-sector-etf.lovable.app",
      etf: {
        fetchedAt: etfFetchedAt,
        count: enrichedETFs.length,
        items: enrichedETFs,
      },
      news: {
        fetchedAt: newsFetchedAt,
        count: newsItems.length,
        items: newsItems,
      },
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("site-summary error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

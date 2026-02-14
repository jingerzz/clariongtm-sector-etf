const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_KEY = "etf-data";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const TICKERS = [
  { ticker: "SPY", name: "S&P 500", sector: "Benchmark" },
  { ticker: "XLB", name: "Materials Select Sector", sector: "Materials" },
  { ticker: "XLC", name: "Communication Services", sector: "Communication" },
  { ticker: "XLE", name: "Energy Select Sector", sector: "Energy" },
  { ticker: "XLF", name: "Financial Select Sector", sector: "Financials" },
  { ticker: "XLI", name: "Industrial Select Sector", sector: "Industrials" },
  { ticker: "XLK", name: "Technology Select Sector", sector: "Technology" },
  { ticker: "XLP", name: "Consumer Staples", sector: "Staples" },
  { ticker: "XLRE", name: "Real Estate Select Sector", sector: "Real Estate" },
  { ticker: "XLU", name: "Utilities Select Sector", sector: "Utilities" },
  { ticker: "XLV", name: "Health Care Select Sector", sector: "Healthcare" },
  { ticker: "XLY", name: "Consumer Discretionary", sector: "Discretionary" },
];

function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function computeMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1];
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function computeFearGreed(
  price: number,
  ma200: number,
  ma50: number,
  ma9: number,
  rsi: number,
  volume: number,
  avgVolume: number
): { score: number; label: string } {
  // Price vs 200d MA (30%)
  const ma200Score = Math.min(100, Math.max(0, 50 + ((price - ma200) / ma200) * 200));
  // Price vs 50d MA (20%)
  const ma50Score = Math.min(100, Math.max(0, 50 + ((price - ma50) / ma50) * 300));
  // 9/50 MA crossover (15%)
  const crossScore = Math.min(100, Math.max(0, 50 + ((ma9 - ma50) / ma50) * 500));
  // RSI (25%)
  const rsiScore = rsi;
  // Volume trend (10%)
  const volScore = avgVolume > 0 ? Math.min(100, Math.max(0, (volume / avgVolume) * 50)) : 50;

  const score = Math.round(
    ma200Score * 0.3 + ma50Score * 0.2 + crossScore * 0.15 + rsiScore * 0.25 + volScore * 0.1
  );
  const clamped = Math.min(100, Math.max(0, score));

  let label: string;
  if (clamped <= 20) label = "Extreme Fear";
  else if (clamped <= 40) label = "Fear";
  else if (clamped <= 60) label = "Neutral";
  else if (clamped <= 80) label = "Greed";
  else label = "Extreme Greed";

  return { score: clamped, label };
}

async function fetchYahooData(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!resp.ok) throw new Error(`Yahoo API error for ${ticker}: ${resp.status}`);
  const json = await resp.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${ticker}`);

  const closes: number[] = result.indicators?.quote?.[0]?.close?.filter((c: any) => c != null) || [];
  const volumes: number[] = result.indicators?.quote?.[0]?.volume?.filter((v: any) => v != null) || [];
  const price = closes[closes.length - 1];
  const volume = volumes[volumes.length - 1] || 0;

  // Average volume (last 50 days)
  const recentVolumes = volumes.slice(-50);
  const avgVolume = recentVolumes.length > 0
    ? Math.round(recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length)
    : 0;

  const ma9 = computeMA(closes, 9);
  const ma50 = computeMA(closes, 50);
  const ma200 = computeMA(closes, 200);
  const rsi = computeRSI(closes);

  const { score: fearGreedScore, label: fearGreedLabel } = computeFearGreed(
    price, ma200, ma50, ma9, rsi, volume, avgVolume
  );

  return {
    price,
    ma9,
    ma50,
    ma200,
    rsi,
    volume,
    avgVolume,
    fearGreedScore,
    fearGreedLabel,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate the request has authorization
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
      console.info("Cache hit for etf-data");
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.info("Cache miss — fetching fresh ETF data");

    // Fetch all tickers in parallel
    const results = await Promise.allSettled(
      TICKERS.map(async (t) => {
        const data = await fetchYahooData(t.ticker);
        return { ...t, ...data };
      })
    );

    const items = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);

    if (items.length === 0) {
      throw new Error("Failed to fetch data for all tickers");
    }

    const now = new Date().toISOString();
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
    console.error("fetch-etf-data error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

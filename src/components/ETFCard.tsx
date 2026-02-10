import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ETFItem } from "@/hooks/useETFData";

function trendIcon(current: number, ma: number) {
  if (current > ma * 1.005) return <TrendingUp className="w-3 h-3 text-[hsl(142,71%,45%)]" />;
  if (current < ma * 0.995) return <TrendingDown className="w-3 h-3 text-[hsl(0,84%,60%)]" />;
  return <Minus className="w-3 h-3 text-[hsl(45,93%,47%)]" />;
}

function rsiColor(rsi: number) {
  if (rsi >= 70) return "text-[hsl(0,84%,60%)]";
  if (rsi <= 30) return "text-[hsl(142,71%,45%)]";
  return "text-[hsl(45,93%,47%)]";
}

function rsiLabel(rsi: number) {
  if (rsi >= 70) return "Overbought";
  if (rsi <= 30) return "Oversold";
  return "Neutral";
}

function fgColor(score: number) {
  if (score <= 20) return "hsl(0,84%,60%)";
  if (score <= 40) return "hsl(20,90%,50%)";
  if (score <= 60) return "hsl(45,93%,47%)";
  if (score <= 80) return "hsl(90,60%,45%)";
  return "hsl(142,71%,45%)";
}


export function ETFCard({ etf }: { etf: ETFItem }) {
  const dailyChange = ((etf.price - etf.ma9) / etf.ma9) * 100;
  const isPositive = dailyChange >= 0;

  return (
    <div className="border border-[hsl(0,0%,18%)] rounded-lg bg-[hsl(0,0%,7%)] p-4 flex flex-col gap-2">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-[hsl(0,0%,95%)]">{etf.ticker}</span>
          <span className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)]">
            {etf.sector}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-sm font-semibold text-[hsl(0,0%,90%)]">
            ${etf.price.toFixed(2)}
          </span>
          <span
            className={`text-xs font-mono ${
              isPositive ? "text-[hsl(142,71%,45%)]" : "text-[hsl(0,84%,60%)]"
            }`}
          >
            {isPositive ? "+" : ""}
            {dailyChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 50-day MA */}
      <div className="flex items-center gap-2 text-xs text-[hsl(0,0%,55%)]">
        <span>50d MA</span>
        <span className="font-mono text-[hsl(0,0%,75%)]">{etf.ma50.toFixed(2)}</span>
        {trendIcon(etf.price, etf.ma50)}
      </div>

      {/* RSI */}
      <div className="flex items-center gap-1 text-xs">
        <span className="text-[hsl(0,0%,50%)]">RSI</span>
        <span className={`font-mono font-semibold ${rsiColor(etf.rsi)}`}>
          {etf.rsi.toFixed(1)}
        </span>
        <span className={`text-[10px] ${rsiColor(etf.rsi)}`}>{rsiLabel(etf.rsi)}</span>
      </div>

      {/* Fear/Greed Bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[hsl(0,0%,50%)] w-8 shrink-0">F/G</span>
        <div className="flex-1 h-2 rounded-full bg-[hsl(0,0%,15%)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${etf.fearGreedScore}%`,
              backgroundColor: fgColor(etf.fearGreedScore),
            }}
          />
        </div>
        <span
          className="text-[10px] font-mono font-semibold w-6 text-right"
          style={{ color: fgColor(etf.fearGreedScore) }}
        >
          {etf.fearGreedScore}
        </span>
      </div>
      <div className="text-[10px] text-right pb-0.5" style={{ color: fgColor(etf.fearGreedScore) }}>
        {etf.fearGreedLabel}
      </div>
    </div>
  );
}

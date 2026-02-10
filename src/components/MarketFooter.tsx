import { useMarketStatus } from "@/hooks/useMarketStatus";
import { useETFData } from "@/hooks/useETFData";
import { useMarketNews } from "@/hooks/useMarketNews";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function MarketFooter() {
  const isOpen = useMarketStatus();
  const { data: etfData } = useETFData();
  const { data: newsData } = useMarketNews();

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-[hsl(0,0%,18%)] text-[10px] text-[hsl(0,0%,45%)]">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            isOpen ? "bg-[hsl(142,71%,45%)]" : "bg-[hsl(0,84%,60%)]"
          }`}
        />
        <span>US Markets: {isOpen ? "Open" : "Closed"}</span>
      </div>
      <span>
        ETF data: {etfData?.fetchedAt ? timeAgo(etfData.fetchedAt) : "loading…"} · News: {newsData?.fetchedAt ? timeAgo(newsData.fetchedAt) : "loading…"}
      </span>
    </footer>
  );
}

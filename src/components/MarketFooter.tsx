import { useMarketStatus } from "@/hooks/useMarketStatus";

export function MarketFooter() {
  const isOpen = useMarketStatus();

  return (
    <footer className="flex items-center px-4 py-2 border-t border-[hsl(0,0%,18%)] text-[10px] text-[hsl(0,0%,45%)]">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            isOpen ? "bg-[hsl(142,71%,45%)]" : "bg-[hsl(0,84%,60%)]"
          }`}
        />
        <span>US Markets: {isOpen ? "Open" : "Closed"}</span>
      </div>
    </footer>
  );
}

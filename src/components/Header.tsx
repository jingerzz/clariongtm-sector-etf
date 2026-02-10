import { RefreshCw } from "lucide-react";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function Header() {
  const isOpen = useMarketStatus();
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    queryClient.invalidateQueries({ queryKey: ["etf-data"] });
    queryClient.invalidateQueries({ queryKey: ["market-news"] });
    setTimeout(() => setSpinning(false), 1000);
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[hsl(0,0%,20%)]">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-widest font-mono text-[hsl(0,0%,90%)]">
          SECTOR ETF TRACKER
        </h1>
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            isOpen ? "bg-[hsl(142,71%,45%)]" : "bg-[hsl(0,84%,60%)]"
          }`}
          title={isOpen ? "Market Open" : "Market Closed"}
        />
      </div>
      <button
        onClick={handleRefresh}
        className="p-2 rounded hover:bg-[hsl(0,0%,15%)] text-[hsl(0,0%,60%)] hover:text-[hsl(0,0%,90%)] transition-colors"
        title="Refresh data"
      >
        <RefreshCw className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} />
      </button>
    </header>
  );
}

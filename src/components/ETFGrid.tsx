import { useETFData } from "@/hooks/useETFData";
import { ETFCard } from "./ETFCard";
import { Skeleton } from "@/components/ui/skeleton";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function ETFGrid() {
  const { data, isLoading, error } = useETFData();

  if (error) {
    return (
      <div className="p-4 text-[hsl(0,84%,60%)] text-sm">
        Failed to load ETF data. Will retry automatically.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 min-h-0">
      {data?.fetchedAt && (
        <p className="text-[10px] text-[hsl(0,0%,40%)] mb-3">
          Updated {timeAgo(data.fetchedAt)}
        </p>
      )}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44 bg-[hsl(0,0%,10%)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data?.items.map((etf) => (
            <ETFCard key={etf.ticker} etf={etf} />
          ))}
        </div>
      )}
    </div>
  );
}

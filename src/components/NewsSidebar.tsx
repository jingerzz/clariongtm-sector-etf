import { useMarketNews } from "@/hooks/useMarketNews";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NewsSidebar() {
  const { data, isLoading } = useMarketNews();

  return (
    <aside className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-[hsl(0,0%,18%)] flex flex-col bg-[hsl(0,0%,5%)] max-h-[40vh] lg:max-h-none">
      <div className="px-4 py-3 border-b border-[hsl(0,0%,18%)]">
        <h2 className="text-xs font-bold tracking-widest font-mono text-[hsl(0,0%,70%)]">
          MARKET NEWS
        </h2>
        {data?.fetchedAt && (
          <p className="text-[10px] text-[hsl(0,0%,35%)] mt-1">
            Updated {timeAgo(data.fetchedAt)}
          </p>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 bg-[hsl(0,0%,10%)]" />
              ))
            : data?.items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-[hsl(0,0%,15%)] bg-[hsl(0,0%,7%)] hover:border-[hsl(0,0%,25%)] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-[hsl(0,0%,85%)] leading-tight group-hover:text-[hsl(0,0%,95%)]">
                      {item.headline}
                    </h3>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-[hsl(0,0%,30%)] group-hover:text-[hsl(0,0%,60%)]" />
                  </div>
                  <p className="text-[11px] text-[hsl(0,0%,50%)] mt-1.5 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-[hsl(210,50%,60%)]">{item.source}</span>
                    <span className="text-[10px] text-[hsl(0,0%,35%)]">
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                </a>
              ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

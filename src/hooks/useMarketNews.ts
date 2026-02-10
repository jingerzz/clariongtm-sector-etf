import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMarketStatus } from "./useMarketStatus";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
}

interface NewsResponse {
  fetchedAt: string;
  items: NewsItem[];
}

export function useMarketNews() {
  const isMarketOpen = useMarketStatus();

  return useQuery<NewsResponse>({
    queryKey: ["market-news"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-etf-news");
      if (error) throw error;
      return data as NewsResponse;
    },
    refetchInterval: isMarketOpen ? 15 * 60_000 : 60 * 60_000,
    staleTime: 5 * 60_000,
  });
}

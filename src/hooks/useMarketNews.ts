import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
  hoursAgo?: number;
}

interface NewsResponse {
  fetchedAt: string;
  items: NewsItem[];
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function useMarketNews() {
  return useQuery<NewsResponse>({
    queryKey: ["market-news"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-etf-news");
      if (error) throw error;
      return data as NewsResponse;
    },
    staleTime: TWENTY_FOUR_HOURS,
    gcTime: TWENTY_FOUR_HOURS,
  });
}

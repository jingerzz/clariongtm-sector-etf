import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery<NewsResponse>({
    queryKey: ["market-news"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-etf-news");
      if (error) throw error;
      return data as NewsResponse;
    },
  });
}

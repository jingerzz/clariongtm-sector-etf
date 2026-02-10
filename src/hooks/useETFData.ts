import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMarketStatus } from "./useMarketStatus";

export interface ETFItem {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  ma200: number;
  ma50: number;
  ma9: number;
  rsi: number;
  volume: number;
  avgVolume: number;
  fearGreedScore: number;
  fearGreedLabel: string;
}

interface ETFResponse {
  fetchedAt: string;
  items: ETFItem[];
}

export function useETFData() {
  const isMarketOpen = useMarketStatus();

  return useQuery<ETFResponse>({
    queryKey: ["etf-data"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-etf-data");
      if (error) throw error;
      return data as ETFResponse;
    },
    refetchInterval: isMarketOpen ? 5 * 60_000 : 30 * 60_000,
    staleTime: 60_000,
  });
}

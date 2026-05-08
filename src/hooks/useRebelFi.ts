import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RebelFiSummary {
  totalValueUsd: number;
  yieldEarnedUsd: number;
  averageApy: number;
  walletsCount: number;
  allocationsCount: number;
  venuesCount: number;
}

export interface RebelFiData {
  ok: boolean;
  base_url: string;
  summary: RebelFiSummary;
  wallets: any[];
  allocations: any[];
  operations: any[];
  venues: any[];
  errors?: Record<string, any>;
}

export function useRebelFi() {
  return useQuery<RebelFiData>({
    queryKey: ["rebelfi-treasury"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rebelfi-proxy", {
        body: { action: "summary" },
      });
      if (error) throw error;
      return data as RebelFiData;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
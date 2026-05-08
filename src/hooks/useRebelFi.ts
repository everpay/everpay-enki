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
  degraded?: boolean;
  error?: string;
  base_url: string;
  attempted?: Record<string, any>;
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
      const payload = (data || {}) as Partial<RebelFiData> & { error?: string };
      return {
        ok: payload.ok !== false,
        degraded: payload.degraded || payload.ok === false,
        error: payload.error,
        base_url: payload.base_url || "api.rebelfi.io / sandbox-api.rebelfi.io",
        attempted: payload.attempted,
        summary: payload.summary || {
          totalValueUsd: 0,
          yieldEarnedUsd: 0,
          averageApy: 0,
          walletsCount: 0,
          allocationsCount: 0,
          venuesCount: 0,
        },
        wallets: payload.wallets || [],
        allocations: payload.allocations || [],
        operations: payload.operations || [],
        venues: payload.venues || [],
        errors: payload.errors,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
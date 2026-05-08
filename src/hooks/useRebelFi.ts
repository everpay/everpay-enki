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
  served_from_cache?: boolean;
  cache_fetched_at?: string | null;
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

export function useRebelFi(enabled = true) {
  return useQuery<RebelFiData>({
    queryKey: ["rebelfi-treasury"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rebelfi-proxy", {
        body: { action: "summary" },
      });
      if (error) {
        return {
          ok: true,
          degraded: true,
          error: error.message || "RebelFi proxy request failed",
          base_url: "api.rebelfi.io / sandbox-api.rebelfi.io",
          attempted: { proxy_action: "summary", edge_function: "rebelfi-proxy", provider_route: "RebelFi" },
          summary: { totalValueUsd: 0, yieldEarnedUsd: 0, averageApy: 0, walletsCount: 0, allocationsCount: 0, venuesCount: 0 },
          wallets: [],
          allocations: [],
          operations: [],
          venues: [],
          errors: { proxy: error.message || error },
        } satisfies RebelFiData;
      }
      const payload = (data || {}) as Partial<RebelFiData> & { error?: string };
      return {
        ok: payload.ok !== false,
        degraded: payload.degraded || payload.ok === false,
        served_from_cache: (payload as any).served_from_cache,
        cache_fetched_at: (payload as any).cache_fetched_at ?? null,
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
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
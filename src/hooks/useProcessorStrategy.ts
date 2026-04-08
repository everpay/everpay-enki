import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

// Helper: cast table name to bypass strict typing when DB types aren't generated yet
const from = (table: string) => supabase.from(table as any);

function useFetch<T>(table: string, key: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await from(table).select("*");
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

function useRealtimeSubscription(table: string, queryKey: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: [queryKey] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, queryKey, qc]);
}

// ---- Processors ----
export function useStrategyProcessors() {
  useRealtimeSubscription("processors", "strategy-processors");
  return useFetch<any>("processors", "strategy-processors");
}

export function useUpsertProcessor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proc: any) => {
      const { error } = await from("processors").upsert(proc, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategy-processors"] }); toast.success("Processor saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteProcessor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from("processors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategy-processors"] }); toast.success("Processor deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Processor Strategy ----
export function useStrategies() {
  useRealtimeSubscription("processor_strategy", "strategies");
  return useFetch<any>("processor_strategy", "strategies");
}

export function useUpsertStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: any) => {
      const { error } = await from("processor_strategy").upsert(s, { onConflict: "processor_id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategies"] }); toast.success("Strategy saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Fee Profiles (existing table, different schema) ----
export function useStrategyFeeProfiles() {
  useRealtimeSubscription("processor_fee_profiles", "strategy-fee-profiles");
  return useFetch<any>("processor_fee_profiles", "strategy-fee-profiles");
}

// ---- Platform Markups ----
export function useMarkups() {
  useRealtimeSubscription("platform_fee_markups", "markups");
  return useFetch<any>("platform_fee_markups", "markups");
}

export function useUpsertMarkup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: any) => {
      const { id, ...rest } = m;
      if (id) {
        const { error } = await from("platform_fee_markups").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await from("platform_fee_markups").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["markups"] }); toast.success("Markup saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteMarkup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from("platform_fee_markups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["markups"] }); toast.success("Markup deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Routing Logs ----
export function useRoutingAttemptLogs() {
  useRealtimeSubscription("routing_attempt_logs", "routing-logs");
  return useFetch<any>("routing_attempt_logs", "routing-logs");
}

// ---- Merchants (enriched) ----
export function useStrategyMerchants() {
  useRealtimeSubscription("merchants", "strategy-merchants");
  return useFetch<any>("merchants", "strategy-merchants");
}

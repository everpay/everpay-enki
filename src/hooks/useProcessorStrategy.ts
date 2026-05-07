import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extSelect, extInsert, extUpdate, extDelete, extUpsert } from "@/hooks/useExternalData";
import { toast } from "sonner";

function useExtFetch<T>(table: string, key: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      return (await extSelect(table)) as T[];
    },
  });
}

// ---- Processors ----
export function useStrategyProcessors() {
  return useExtFetch<any>("processors", "strategy-processors");
}

export function useUpsertProcessor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proc: any) => {
      await extUpsert("processors", proc, "id");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategy-processors"] }); toast.success("Processor saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteProcessor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await extDelete("processors", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategy-processors"] }); toast.success("Processor deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Processor Strategy ----
export function useStrategies() {
  return useExtFetch<any>("processor_strategy", "strategies");
}

export function useUpsertStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: any) => {
      await extUpsert("processor_strategy", s, "processor_id");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategies"] }); toast.success("Strategy saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Fee Profiles ----
export function useStrategyFeeProfiles() {
  return useExtFetch<any>("processor_fee_profiles", "strategy-fee-profiles");
}

export function useUpsertFeeProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: any) => {
      const { id, ...rest } = f;
      if (id) {
        await extUpdate("processor_fee_profiles", id, rest);
      } else {
        await extInsert("processor_fee_profiles", rest);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategy-fee-profiles"] }); toast.success("Fee profile saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFeeProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await extDelete("processor_fee_profiles", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strategy-fee-profiles"] }); toast.success("Fee profile deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Platform Markups ----
export function useMarkups() {
  return useExtFetch<any>("platform_fee_markups", "markups");
}

export function useUpsertMarkup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: any) => {
      const { id, ...rest } = m;
      if (id) {
        await extUpdate("platform_fee_markups", id, rest);
      } else {
        await extInsert("platform_fee_markups", rest);
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
      await extDelete("platform_fee_markups", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["markups"] }); toast.success("Markup deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---- Routing Logs ----
export function useRoutingAttemptLogs() {
  return useExtFetch<any>("routing_attempt_logs", "routing-logs");
}

// ---- Merchants (enriched) ----
export function useStrategyMerchants() {
  return useExtFetch<any>("merchants", "strategy-merchants");
}

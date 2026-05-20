import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Processor,
  MerchantRow,
  RoutingRuleRow,
  MerchantProcessor,
  PerfPoint,
} from "@/lib/routing-maestro/types";

const PROCESSOR_CAPS: Record<string, number> = {
  shieldhub: 5_000_000,
  makapay: 3_000_000,
  paygate10: 2_000_000,
  mondo: 2_500_000,
  matrix: 4_000_000,
};

// ─── Composite metrics endpoint (BFF) ─────────────────────────
export type RoutingMetricsFilters = {
  from?: string;
  to?: string;
  processors?: string[];
  merchantIds?: string[];
  decisionLimit?: number;
};

export type RoutingMetricsResponse = {
  processors: (Processor & { totalCount: number })[];
  trend: PerfPoint[];
  decisions: {
    id: string;
    merchant: string;
    amount: string;
    status: "success" | "failed" | "pending";
    provider: string;
    createdAt: string;
  }[];
  merchants: { id: string; name: string; status: string; region: string | null }[];
  totals: { transactions: number; volume: number; activeProcessors: number };
  from: string;
  to: string;
};

export function useRoutingMetrics(filters: RoutingMetricsFilters) {
  return useQuery({
    queryKey: ["rm:metrics", filters],
    queryFn: async (): Promise<RoutingMetricsResponse> => {
      const { data, error } = await supabase.functions.invoke("routing-metrics", { body: filters });
      if (error) throw error;
      return data as RoutingMetricsResponse;
    },
    staleTime: 30_000,
  });
}

// ─── Processors ────────────────────────────────────────────────
export function useProcessors() {
  return useQuery({
    queryKey: ["rm:processors"],
    queryFn: async (): Promise<Processor[]> => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [{ data: procs }, { data: txns }] = await Promise.all([
        supabase.from("payment_processors").select("name, display_name, active"),
        supabase
          .from("transactions")
          .select("provider, status, amount")
          .gte("created_at", since),
      ]);

      const byProc: Record<string, { ok: number; fail: number; total: number; volume: number }> = {};
      (txns ?? []).forEach((t: any) => {
        const p = t.provider;
        const e = (byProc[p] ||= { ok: 0, fail: 0, total: 0, volume: 0 });
        e.total++;
        if (t.status === "completed") {
          e.ok++;
          e.volume += Number(t.amount) || 0;
        } else if (t.status === "failed") e.fail++;
      });

      return (procs ?? []).map((p: any): Processor => {
        const m = byProc[p.name] || { ok: 0, fail: 0, total: 0, volume: 0 };
        const successRate = m.total ? +((m.ok / m.total) * 100).toFixed(1) : 100;
        const failureRate = m.total ? +((m.fail / m.total) * 100).toFixed(1) : 0;
        const cap = PROCESSOR_CAPS[p.name] ?? 1_000_000;
        return {
          id: p.name,
          name: p.display_name || p.name,
          enabled: !!p.active,
          successRate,
          volume: Math.round(m.volume),
          failureRate,
          latency: 200 + (p.name.length * 13) % 200, // deterministic placeholder
          monthlyCap: cap,
          currentVolume: Math.round(m.volume),
        };
      });
    },
  });
}

// ─── Merchants ────────────────────────────────────────────────
export function useRoutingMerchants() {
  return useQuery({
    queryKey: ["rm:merchants"],
    queryFn: async (): Promise<MerchantRow[]> => {
      const { data } = await supabase
        .from("merchants")
        .select("id, name, status, region")
        .order("created_at", { ascending: false });
      return (data ?? []).map((m: any): MerchantRow => ({
        id: m.id,
        name: m.name || "Untitled Merchant",
        industry: m.region || "—",
        status: m.status === "active" ? "active" : "inactive",
        overrideEnabled: false,
      }));
    },
  });
}

// ─── Per-merchant processor priorities (psp_routes) ───────────
export function useMerchantProcessors(merchantId?: string) {
  return useQuery({
    queryKey: ["rm:merchant-processors", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<MerchantProcessor[]> => {
      const [{ data: routes }, { data: procs }] = await Promise.all([
        supabase
          .from("psp_routes")
          .select("processor, priority, active")
          .eq("merchant_id", merchantId!)
          .order("priority"),
        supabase.from("payment_processors").select("name, display_name"),
      ]);
      const nameMap = new Map((procs ?? []).map((p: any) => [p.name, p.display_name || p.name]));
      return (routes ?? []).map((r: any, i: number): MerchantProcessor => ({
        processorId: r.processor,
        processorName: nameMap.get(r.processor) || r.processor,
        priority: r.priority ?? i + 1,
        weight: Math.round(100 / Math.max(1, routes!.length)),
        enabled: !!r.active,
        monthlyCap: PROCESSOR_CAPS[r.processor] ?? 500_000,
        currentVolume: 0,
      }));
    },
  });
}

// ─── Routing Rules ────────────────────────────────────────────
function ruleToRow(r: any): RoutingRuleRow {
  const conditions: RoutingRuleRow["conditions"] = [];
  if (r.currency_match?.length) conditions.push({ field: "currency", operator: "in", value: r.currency_match.join(",") });
  if (r.amount_min != null) conditions.push({ field: "amount", operator: ">=", value: String(r.amount_min) });
  if (r.amount_max != null) conditions.push({ field: "amount", operator: "<=", value: String(r.amount_max) });
  return {
    id: r.id,
    name: r.name,
    priority: r.priority,
    enabled: r.active,
    conditions,
    action: "route_to",
    actionTarget: r.target_provider,
    scope: r.merchant_id ? "merchant" : "global",
    merchantId: r.merchant_id ?? undefined,
  };
}

export function useRoutingRules() {
  return useQuery({
    queryKey: ["rm:rules"],
    queryFn: async (): Promise<RoutingRuleRow[]> => {
      const { data } = await supabase
        .from("routing_rules")
        .select("*")
        .order("priority", { ascending: true });
      return (data ?? []).map(ruleToRow);
    },
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("routing_rules").update({ active: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rm:rules"] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rm:rules"] }),
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      priority: number;
      target_provider: string;
      fallback_provider?: string;
      currency_match?: string[];
      amount_min?: number | null;
      amount_max?: number | null;
      merchant_id: string;
    }) => {
      const { error } = await supabase.from("routing_rules").insert({ ...input, active: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rm:rules"] }),
  });
}

// ─── Performance history (last 30 days, weekly buckets) ───────
export function usePerformanceHistory() {
  return useQuery({
    queryKey: ["rm:perf-history"],
    queryFn: async (): Promise<PerfPoint[]> => {
      const since = new Date(Date.now() - 180 * 86_400_000).toISOString();
      const { data } = await supabase
        .from("transactions")
        .select("provider, status, created_at")
        .gte("created_at", since);
      const buckets: Record<string, Record<string, { ok: number; total: number }>> = {};
      (data ?? []).forEach((t: any) => {
        const d = new Date(t.created_at);
        const key = d.toLocaleString("en-US", { month: "short" });
        const b = (buckets[key] ||= {});
        const p = (b[t.provider] ||= { ok: 0, total: 0 });
        p.total++;
        if (t.status === "completed") p.ok++;
      });
      const months = Object.keys(buckets);
      const providers = new Set<string>();
      Object.values(buckets).forEach((b) => Object.keys(b).forEach((p) => providers.add(p)));
      return months.map((m) => {
        const row: PerfPoint = { date: m };
        providers.forEach((p) => {
          const rec = buckets[m][p];
          row[p] = rec && rec.total ? +((rec.ok / rec.total) * 100).toFixed(1) : 100;
        });
        return row;
      });
    },
  });
}

// ─── Recent routing decisions ─────────────────────────────────
export function useRecentRoutingDecisions(limit = 8) {
  return useQuery({
    queryKey: ["rm:recent-routing", limit],
    queryFn: async () => {
      const { data: txns } = await supabase
        .from("transactions")
        .select("id, amount, currency, provider, status, merchant_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      const merchantIds = [...new Set((txns ?? []).map((t) => t.merchant_id))];
      const { data: merchs } = merchantIds.length
        ? await supabase.from("merchants").select("id, name").in("id", merchantIds)
        : { data: [] as any };
      const nameMap = new Map((merchs ?? []).map((m: any) => [m.id, m.name]));
      return (txns ?? []).map((t: any) => ({
        id: t.id,
        merchant: nameMap.get(t.merchant_id) || "Unknown",
        amount: new Intl.NumberFormat("en-US", { style: "currency", currency: t.currency || "USD" }).format(Number(t.amount) || 0),
        steps: [
          {
            processor: t.provider,
            status: t.status === "completed" ? ("success" as const) : t.status === "failed" ? ("failed" as const) : ("pending" as const),
          },
        ],
      }));
    },
  });
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { gw } from "../_shared/everpay-gateway.ts";
import { verifyJwt, corsHeaders } from "../_shared/auth.ts";

const jr = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Compares local ledger-derived balances + routing/settlement state with
// the authoritative Platform OS gateway data and returns any mismatches.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const v = await verifyJwt(req, { requireRoles: ["admin", "super_admin"], allowExternalRoles: true });
  if (!v.ok) return v.response;
  const local = v.localAdmin ?? createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const mismatches: any[] = [];
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // 1) Local merchants
  const { data: merchants = [] } = await local
    .from("merchants")
    .select("id, name, currency")
    .limit(500);

  for (const m of merchants ?? []) {
    // ---- Derived balance from ledger_entries
    const { data: ledger = [] } = await local
      .from("ledger_entries")
      .select("amount, currency, entry_type, transaction_id")
      .limit(5000);
    const { data: txMap = [] } = await local
      .from("transactions")
      .select("id, amount, currency")
      .eq("merchant_id", m.id)
      .limit(5000);
    const txIds = new Set((txMap ?? []).map((t: any) => t.id));
    let derived = 0;
    for (const e of ledger ?? []) {
      if (!txIds.has((e as any).transaction_id)) continue;
      derived += (e as any).entry_type === "credit" ? Number((e as any).amount) : -Number((e as any).amount);
    }
    derived = Math.round(derived * 100) / 100;

    // ---- Gateway derived balance (sum of completed transactions)
    let gwBalance: number | null = null;
    try {
      const r = await gw<{ data: any[] }>("db.select", {
        table: "transactions",
        filters: { merchant_id: m.id, status: "completed" },
        select: "amount, currency",
      });
      gwBalance = Math.round(((r.data ?? []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0)) * 100) / 100;
    } catch (e) {
      mismatches.push({ kind: "balance.gateway_unreachable", merchant_id: m.id, error: (e as Error).message });
      continue;
    }
    if (gwBalance != null && Math.abs(derived - gwBalance) > 0.01) {
      mismatches.push({
        kind: "balance.mismatch",
        merchant_id: m.id,
        merchant_name: m.name,
        ledger_derived: derived,
        gateway_total: gwBalance,
        delta: Math.round((derived - gwBalance) * 100) / 100,
      });
    }

    // ---- Routing state: compare active providers local vs gateway
    const { data: localRoutes = [] } = await local
      .from("psp_routes").select("processor, active").eq("merchant_id", m.id);
    const localActive = new Set((localRoutes ?? []).filter((r: any) => r.active).map((r: any) => r.processor));
    try {
      const gr = await gw<{ data: any[] }>("db.select", {
        table: "psp_routes",
        filters: { merchant_id: m.id },
        select: "processor, active",
      });
      const gwActive = new Set((gr.data ?? []).filter((r: any) => r.active).map((r: any) => r.processor));
      const only_local = [...localActive].filter(x => !gwActive.has(x));
      const only_gateway = [...gwActive].filter(x => !localActive.has(x));
      if (only_local.length || only_gateway.length) {
        mismatches.push({
          kind: "routing.state_drift",
          merchant_id: m.id, merchant_name: m.name,
          only_local, only_gateway,
        });
      }
    } catch (e) {
      mismatches.push({ kind: "routing.gateway_unreachable", merchant_id: m.id, error: (e as Error).message });
    }

    // ---- Settlement status: pending counts local vs gateway
    const { data: localSettle = [] } = await local
      .from("settlement_batches").select("status").eq("merchant_id", m.id);
    const localPending = (localSettle ?? []).filter((s: any) => s.status === "pending").length;
    try {
      const gs = await gw<{ data: any[] }>("db.select", {
        table: "settlement_batches",
        filters: { merchant_id: m.id },
        select: "status",
      });
      const gwPending = (gs.data ?? []).filter((s: any) => s.status === "pending").length;
      if (localPending !== gwPending) {
        mismatches.push({
          kind: "settlement.pending_drift",
          merchant_id: m.id, merchant_name: m.name,
          local_pending: localPending, gateway_pending: gwPending,
        });
      }
    } catch { /* skip */ }
  }

  // Persist a summary event for audit/UI history
  try {
    await local.from("event_logs").insert({
      event_type: "reconciliation.gateway_check",
      source_service: "gateway-reconciliation-check",
      payload: { run_id: runId, started_at: startedAt, mismatches_count: mismatches.length, mismatches },
    });
  } catch { /* table optional */ }

  return jr({
    ok: true,
    run_id: runId,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    merchants_checked: merchants?.length ?? 0,
    mismatches_count: mismatches.length,
    mismatches,
  });
});
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PROCESSOR_CAPS: Record<string, number> = {
  shieldhub: 5_000_000,
  makapay: 3_000_000,
  paygate10: 2_000_000,
  mondo: 2_500_000,
  matrix: 4_000_000,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authed = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await authed.auth.getClaims(token);
    if (cErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(url, svc);

    // Authorization: admin or super_admin only
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const ok = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!ok) return json({ error: "Forbidden" }, 403);

    const body = req.method === "POST" ? await safeJson(req) : {};
    const from = body.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
    const to = body.to ?? new Date().toISOString();
    const processorFilter: string[] | undefined = body.processors;
    const merchantFilter: string[] | undefined = body.merchantIds;
    const decisionLimit = Math.min(Number(body.decisionLimit ?? 8), 50);

    let txQ = admin
      .from("transactions")
      .select("id, provider, status, amount, currency, merchant_id, latency_ms, created_at")
      .gte("created_at", from)
      .lte("created_at", to);
    if (processorFilter?.length) txQ = txQ.in("provider", processorFilter);
    if (merchantFilter?.length) txQ = txQ.in("merchant_id", merchantFilter);

    const [{ data: txns, error: txErr }, { data: procs }, { data: merchs }] = await Promise.all([
      txQ.limit(50000),
      admin.from("payment_processors").select("name, display_name, active"),
      admin.from("merchants").select("id, name, status, region"),
    ]);
    if (txErr) return json({ error: txErr.message }, 500);

    // ── Per-processor aggregates ───────────────────────────────
    const byProc: Record<string, { ok: number; fail: number; total: number; volume: number; latSum: number; latN: number }> = {};
    (txns ?? []).forEach((t: any) => {
      const e = (byProc[t.provider] ||= { ok: 0, fail: 0, total: 0, volume: 0, latSum: 0, latN: 0 });
      e.total++;
      if (t.status === "completed") {
        e.ok++;
        e.volume += Number(t.amount) || 0;
      } else if (t.status === "failed") e.fail++;
      if (typeof t.latency_ms === "number") { e.latSum += t.latency_ms; e.latN++; }
    });

    const processors = (procs ?? []).map((p: any) => {
      const m = byProc[p.name] || { ok: 0, fail: 0, total: 0, volume: 0, latSum: 0, latN: 0 };
      const successRate = m.total ? +((m.ok / m.total) * 100).toFixed(1) : 100;
      const failureRate = m.total ? +((m.fail / m.total) * 100).toFixed(1) : 0;
      const latency = m.latN ? Math.round(m.latSum / m.latN) : 0;
      const cap = PROCESSOR_CAPS[p.name] ?? 1_000_000;
      return {
        id: p.name,
        name: p.display_name || p.name,
        enabled: !!p.active,
        successRate,
        volume: Math.round(m.volume),
        failureRate,
        latency,
        monthlyCap: cap,
        currentVolume: Math.round(m.volume),
        totalCount: m.total,
      };
    });

    // ── Daily trend buckets ────────────────────────────────────
    const trendMap: Record<string, Record<string, { ok: number; total: number }>> = {};
    (txns ?? []).forEach((t: any) => {
      const day = new Date(t.created_at).toISOString().slice(0, 10);
      const b = (trendMap[day] ||= {});
      const p = (b[t.provider] ||= { ok: 0, total: 0 });
      p.total++;
      if (t.status === "completed") p.ok++;
    });
    const trend = Object.keys(trendMap).sort().map((day) => {
      const row: Record<string, string | number> = { date: day };
      Object.entries(trendMap[day]).forEach(([prov, v]) => {
        row[prov] = v.total ? +((v.ok / v.total) * 100).toFixed(1) : 0;
      });
      return row;
    });

    // ── Recent decisions ───────────────────────────────────────
    const nameMap = new Map((merchs ?? []).map((m: any) => [m.id, m.name || "Untitled"]));
    const decisions = (txns ?? [])
      .slice()
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, decisionLimit)
      .map((t: any) => ({
        id: t.id,
        merchant: nameMap.get(t.merchant_id) || "Unknown",
        amount: `${(Number(t.amount) || 0).toFixed(2)} ${t.currency || "USD"}`,
        status: t.status === "completed" ? "success" : t.status === "failed" ? "failed" : "pending",
        provider: t.provider,
        createdAt: t.created_at,
      }));

    // ── Merchants for filter ───────────────────────────────────
    const merchants = (merchs ?? []).map((m: any) => ({
      id: m.id,
      name: m.name || "Untitled Merchant",
      status: m.status,
      region: m.region,
    }));

    const totals = {
      transactions: (txns ?? []).length,
      volume: processors.reduce((a, p) => a + p.volume, 0),
      activeProcessors: processors.filter((p) => p.enabled).length,
    };

    return json({ processors, trend, decisions, merchants, totals, from, to });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
async function safeJson(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}
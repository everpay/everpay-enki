import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type ResolveInput = {
  merchantId: string;
  currency: string;
  amount: number;
  country?: string | null;
  cardBrand?: string | null;
  riskLevel?: string | null;
  excludeProcessors?: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authed = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await authed.auth.getClaims(token);
    if (cErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(url, svc);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = (await req.json()) as ResolveInput;
    if (!body?.merchantId || !body?.currency || typeof body?.amount !== "number") {
      return json({ error: "merchantId, currency, amount are required" }, 400);
    }
    const exclude = new Set((body.excludeProcessors ?? []).map((s) => s.toLowerCase()));

    // Pull live config in parallel — real data, no simulation defaults
    const [
      { data: merchant },
      { data: rules },
      { data: routes },
      { data: processors },
    ] = await Promise.all([
      admin.from("merchants").select("id, name, region, status").eq("id", body.merchantId).maybeSingle(),
      admin.from("routing_rules").select("*").eq("merchant_id", body.merchantId).order("priority", { ascending: true }),
      admin.from("psp_routes").select("*").eq("merchant_id", body.merchantId).order("priority", { ascending: true }),
      admin.from("payment_processors").select("name, display_name, active"),
    ]);

    if (!merchant) return json({ error: "Merchant not found" }, 404);

    const procMap = new Map((processors ?? []).map((p: any) => [p.name, p]));
    const isProcessorAvailable = (name: string) => {
      if (!name) return false;
      if (exclude.has(name.toLowerCase())) return false;
      const p = procMap.get(name);
      return !!p && p.active === true;
    };

    // ── Rule evaluation (real production logic) ─────────────────
    const evaluations = (rules ?? []).map((r: any) => {
      const reasons: string[] = [];
      let matched = true;

      if (!r.active) { matched = false; reasons.push("rule inactive"); }

      const curList: string[] = Array.isArray(r.currency_match) ? r.currency_match : [];
      if (matched && curList.length > 0 && !curList.includes(body.currency.toUpperCase())) {
        matched = false;
        reasons.push(`currency ${body.currency} not in [${curList.join(",")}]`);
      }
      if (matched && r.amount_min != null && body.amount < Number(r.amount_min)) {
        matched = false;
        reasons.push(`amount ${body.amount} below min ${r.amount_min}`);
      }
      if (matched && r.amount_max != null && body.amount > Number(r.amount_max)) {
        matched = false;
        reasons.push(`amount ${body.amount} above max ${r.amount_max}`);
      }
      if (matched && !isProcessorAvailable(r.target_provider)) {
        matched = false;
        reasons.push(`target ${r.target_provider} unavailable`);
      }

      return {
        ruleId: r.id,
        ruleName: r.name,
        priority: r.priority,
        target: r.target_provider,
        fallback: r.fallback_provider,
        matched,
        reasons,
      };
    });

    const winner = evaluations.find((e) => e.matched);

    // ── Fallback chain from psp_routes (real DB) ────────────────
    const routeChain = (routes ?? [])
      .filter((r: any) => r.active)
      .filter((r: any) => !body.country || !r.country || r.country === body.country)
      .filter((r: any) => !body.cardBrand || !r.card_brand || r.card_brand.toLowerCase() === body.cardBrand.toLowerCase())
      .filter((r: any) => !body.riskLevel || !r.risk_level || r.risk_level === body.riskLevel)
      .map((r: any) => r.processor)
      .filter((p: string) => isProcessorAvailable(p));

    // Build final ordered chain: matched rule's target → its fallback → psp_routes chain
    const chain: string[] = [];
    const push = (p?: string | null) => {
      if (!p) return;
      if (!isProcessorAvailable(p)) return;
      if (!chain.includes(p)) chain.push(p);
    };
    if (winner) {
      push(winner.target);
      push(winner.fallback);
    }
    routeChain.forEach(push);

    return json({
      merchant: { id: merchant.id, name: merchant.name, region: merchant.region },
      input: body,
      winningRule: winner ?? null,
      evaluations,
      chain: chain.map((p, i) => ({
        step: i + 1,
        processor: p,
        displayName: procMap.get(p)?.display_name || p,
      })),
      availableProcessors: Array.from(procMap.values())
        .filter((p: any) => p.active)
        .map((p: any) => ({ id: p.name, name: p.display_name || p.name })),
      generatedAt: new Date().toISOString(),
    });
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
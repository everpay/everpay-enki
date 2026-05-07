import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REBELFI_API_KEY = Deno.env.get("REBELFI_API_KEY") || "";
const REBELFI_BASE = REBELFI_API_KEY.startsWith("rfk_sandbox_")
  ? "https://sandbox-api.rebelfi.io/v1"
  : "https://api.rebelfi.io/v1";

async function rfFetch(path: string, init: RequestInit = {}) {
  const url = `${REBELFI_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "x-api-key": REBELFI_API_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, body: json };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!REBELFI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "REBELFI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Auth: admin/super_admin only ---
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRows } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roleRows || []).some(
      (r: any) => r.role === "admin" || r.role === "super_admin",
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: string = body.action || "summary";

    // --- Action router ---
    if (action === "raw") {
      const { path, method = "GET", payload, query } = body;
      if (!path || typeof path !== "string") {
        return new Response(JSON.stringify({ error: "path required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const qs = query && typeof query === "object"
        ? "?" + new URLSearchParams(query as Record<string, string>).toString()
        : "";
      const r = await rfFetch(`${path}${qs}`, {
        method,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "venues") {
      const qs = new URLSearchParams(body.query || {}).toString();
      const r = await rfFetch(`/venues${qs ? `?${qs}` : ""}`);
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "wallets") {
      const r = await rfFetch(`/wallets`);
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "allocations") {
      const qs = new URLSearchParams(body.query || {}).toString();
      const r = await rfFetch(`/allocations${qs ? `?${qs}` : ""}`);
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "operations") {
      const qs = new URLSearchParams(body.query || {}).toString();
      const r = await rfFetch(`/operations${qs ? `?${qs}` : ""}`);
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "register_wallet") {
      const payload = {
        walletAddress: body.walletAddress,
        blockchain: body.blockchain,
        userId: body.userId || undefined,
        label: body.label || undefined,
      };
      if (!payload.walletAddress || !payload.blockchain) {
        return new Response(JSON.stringify({ error: "walletAddress and blockchain required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await rfFetch(`/wallets`, { method: "POST", body: JSON.stringify(payload) });
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "supply" || action === "unwind") {
      const endpoint = action === "supply" ? "/operations/supply" : "/operations/unwind";
      const payload: any = {
        walletAddress: body.walletAddress,
        strategyId: body.strategyId,
        amount: body.amount, // base-units string
        tokenAddress: body.tokenAddress || undefined,
      };
      if (!payload.walletAddress || !payload.strategyId || !payload.amount) {
        return new Response(JSON.stringify({ error: "walletAddress, strategyId, amount required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await rfFetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_operation") {
      if (!body.operationId) {
        return new Response(JSON.stringify({ error: "operationId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await rfFetch(`/operations/${body.operationId}`);
      return new Response(JSON.stringify(r.body), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: aggregate summary for Treasury 360°
    const [walletsR, allocsR, opsR, venuesR] = await Promise.all([
      rfFetch(`/wallets`),
      rfFetch(`/allocations`),
      rfFetch(`/operations?limit=25`),
      rfFetch(`/venues`),
    ]);

    const wallets = (walletsR.body?.wallets || walletsR.body?.data || walletsR.body || []) as any[];
    const allocations = (allocsR.body?.allocations || allocsR.body?.data || allocsR.body || []) as any[];
    const operations = (opsR.body?.operations || opsR.body?.data || opsR.body || []) as any[];
    const venues = (venuesR.body?.venues || venuesR.body?.data || venuesR.body || []) as any[];

    // Compute totals (amounts come back as base-unit strings; USDC/USDT use 6 decimals)
    const toUnits = (s: string | number | undefined, decimals = 6) => {
      if (s == null) return 0;
      const n = typeof s === "number" ? s : Number(s);
      if (!Number.isFinite(n)) return 0;
      return n / Math.pow(10, decimals);
    };
    let totalValue = 0;
    let totalEarned = 0;
    let apySum = 0;
    let apyCount = 0;
    for (const a of Array.isArray(allocations) ? allocations : []) {
      totalValue += toUnits(a.currentValue ?? a.balance ?? a.value);
      totalEarned += toUnits(a.earnings ?? a.yieldEarned ?? a.earned);
      const apy = Number(a.apy ?? a.currentApy ?? 0);
      if (apy > 0) { apySum += apy; apyCount += 1; }
    }

    return new Response(JSON.stringify({
      ok: true,
      base_url: REBELFI_BASE,
      summary: {
        totalValueUsd: totalValue,
        yieldEarnedUsd: totalEarned,
        averageApy: apyCount ? apySum / apyCount : 0,
        walletsCount: Array.isArray(wallets) ? wallets.length : 0,
        allocationsCount: Array.isArray(allocations) ? allocations.length : 0,
        venuesCount: Array.isArray(venues) ? venues.length : 0,
      },
      wallets,
      allocations,
      operations,
      venues,
      errors: {
        wallets: walletsR.ok ? null : walletsR.body,
        allocations: allocsR.ok ? null : allocsR.body,
        operations: opsR.ok ? null : opsR.body,
        venues: venuesR.ok ? null : venuesR.body,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
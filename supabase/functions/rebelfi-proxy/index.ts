import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const REBELFI_API_KEY = Deno.env.get("REBELFI_API_KEY") || "";
const REBELFI_BASE = REBELFI_API_KEY.startsWith("rfk_sandbox_")
  ? "https://sandbox-api.rebelfi.io/v1"
  : "https://api.rebelfi.io/v1";

// Always respond 200 so supabase.functions.invoke does not collapse upstream
// errors into the generic "Failed to send a request to the Edge Function".
// Callers should inspect body.ok / body.error / body.statusCode.
function jsonOk(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function rfFetch(path: string, init: RequestInit = {}) {
  const url = `${REBELFI_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
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
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      body: {
        error: e?.name === "AbortError" ? "RebelFi upstream timed out" : "RebelFi upstream request failed",
        message: e?.message || String(e),
        fallback: true,
        url,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!REBELFI_API_KEY) {
      return jsonOk({ ok: false, error: "REBELFI_API_KEY not configured" });
    }

    // --- Auth: admin/super_admin only ---
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return jsonOk({ ok: false, error: "Unauthorized" });
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
      return jsonOk({ ok: false, error: "Unauthorized" });
    }
    const { data: roleRows } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roleRows || []).some(
      (r: any) => r.role === "admin" || r.role === "super_admin",
    );
    if (!isAdmin) {
      return jsonOk({ ok: false, error: "Forbidden — admin role required" });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: string = body.action || "summary";

    // --- Action router ---
    if (action === "raw") {
      const { path, method = "GET", payload, query } = body;
      if (!path || typeof path !== "string") {
        return jsonOk({ ok: false, error: "path required" });
      }
      const qs = query && typeof query === "object"
        ? "?" + new URLSearchParams(query as Record<string, string>).toString()
        : "";
      const r = await rfFetch(`${path}${qs}`, {
        method,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      return jsonOk({ ok: r.ok, status: r.status, data: r.body });
    }

    if (action === "venues") {
      const qs = new URLSearchParams(body.query || {}).toString();
      const r = await rfFetch(`/venues${qs ? `?${qs}` : ""}`);
      return jsonOk({ ok: r.ok, status: r.status, data: r.body });
    }

    if (action === "wallets") {
      const r = await rfFetch(`/wallets`);
      return jsonOk({ ok: r.ok, status: r.status, data: r.body });
    }

    if (action === "allocations") {
      const qs = new URLSearchParams(body.query || {}).toString();
      const r = await rfFetch(`/allocations${qs ? `?${qs}` : ""}`);
      return jsonOk({ ok: r.ok, status: r.status, data: r.body });
    }

    if (action === "operations") {
      const qs = new URLSearchParams(body.query || {}).toString();
      const r = await rfFetch(`/operations${qs ? `?${qs}` : ""}`);
      return jsonOk({ ok: r.ok, status: r.status, data: r.body });
    }

    if (action === "register_wallet") {
      const payload = {
        walletAddress: body.walletAddress,
        blockchain: body.blockchain,
        userId: body.userId || undefined,
        label: body.label || undefined,
      };
      if (!payload.walletAddress || !payload.blockchain) {
        return jsonOk({ ok: false, error: "walletAddress and blockchain required" });
      }
      const r = await rfFetch(`/wallets`, { method: "POST", body: JSON.stringify(payload) });
      return jsonOk({
        ok: r.ok,
        status: r.status,
        data: r.ok ? r.body : null,
        error: r.ok ? undefined : (r.body?.message || r.body?.error || `RebelFi returned ${r.status}`),
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
        return jsonOk({ ok: false, error: "walletAddress, strategyId, amount required" });
      }
      const r = await rfFetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
      return jsonOk({
        ok: r.ok,
        status: r.status,
        data: r.ok ? r.body : null,
        error: r.ok ? undefined : (r.body?.message || r.body?.error || `RebelFi returned ${r.status}`),
      });
    }

    if (action === "get_operation") {
      if (!body.operationId) {
        return jsonOk({ ok: false, error: "operationId required" });
      }
      const r = await rfFetch(`/operations/${body.operationId}`);
      return jsonOk({ ok: r.ok, status: r.status, data: r.body });
    }

    // Default: aggregate summary for Treasury 360°
    const [walletsR, allocsR, opsR, venuesR] = await Promise.all([
      rfFetch(`/wallets`),
      rfFetch(`/allocations`),
      rfFetch(`/operations?limit=25`),
      rfFetch(`/venues`),
    ]);

    const normalizeList = (body: any, keys: string[]) => {
      for (const key of keys) {
        if (Array.isArray(body?.[key])) return body[key];
      }
      if (Array.isArray(body?.data)) return body.data;
      if (Array.isArray(body)) return body;
      return [];
    };

    const wallets = normalizeList(walletsR.body, ["wallets"]);
    const allocations = normalizeList(allocsR.body, ["allocations"]);
    const operations = normalizeList(opsR.body, ["operations"]);
    const venues = normalizeList(venuesR.body, ["venues"]);
    const errors = {
      wallets: walletsR.ok ? null : walletsR.body,
      allocations: allocsR.ok ? null : allocsR.body,
      operations: opsR.ok ? null : opsR.body,
      venues: venuesR.ok ? null : venuesR.body,
    };
    const failed = Object.entries(errors).filter(([, v]) => Boolean(v));

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
      degraded: failed.length > 0,
      error: failed.length > 0 ? `RebelFi returned ${failed.length} failed sub-call${failed.length === 1 ? "" : "s"}; showing available cached/empty data.` : undefined,
      base_url: REBELFI_BASE,
      attempted: {
        proxy_action: "summary",
        edge_function: "rebelfi-proxy",
        provider_route: "RebelFi",
        sub_calls: ["GET /v1/wallets", "GET /v1/allocations", "GET /v1/operations?limit=25", "GET /v1/venues"],
      },
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
      errors,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return jsonOk({ ok: false, error: e?.message || String(e) });
  }
});
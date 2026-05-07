// System status probe — checks routing-critical integrations.
// Returns one JSON blob the admin dashboard renders into status pills.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ProbeResult {
  id: string;
  label: string;
  status: "healthy" | "degraded" | "down";
  http_status: number | null;
  latency_ms: number;
  message: string;
  last_error?: { event_id: string; transaction_id: string | null; occurred_at: string; summary: string } | null;
}

interface ProbeOpts {
  method?: "GET" | "HEAD" | "POST";
  body?: string;
  headers?: Record<string, string>;
  /**
   * Status codes that should be treated as healthy. Many PSP APIs reject
   * anonymous root GETs with 401/403/404 — that still proves the host is up
   * and routing requests, so we treat them as healthy by default.
   */
  healthyStatuses?: number[];
  timeoutMs?: number;
}

async function probe(url: string, opts: ProbeOpts = {}) {
  const { method = "GET", body, headers = {}, healthyStatuses = [], timeoutMs = 6000 } = opts;
  const started = Date.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method,
      body,
      headers: { "user-agent": "Everpay-SystemStatus/1.0", ...headers },
      redirect: "manual",
      signal: ctrl.signal,
    });
    await r.body?.cancel();
    const ok = r.status < 500 || healthyStatuses.includes(r.status);
    return { status: r.status, latencyMs: Date.now() - started, ok };
  } catch (e) {
    return { status: null, latencyMs: Date.now() - started, ok: false, error: (e as Error).message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Matrix Payment Gateway rejects anonymous GETs at the root — that timed
 * out our old probe and produced a false "down" signal. Instead we POST a
 * known endpoint (`/v1/project/details`) with a deliberately empty
 * authentication payload. A live gateway responds with a structured 4xx
 * (auth/validation error) within ~1s, which is exactly what we want to
 * detect "reachable + processing requests".
 */
async function probeMatrix() {
  // Matrix's documented API host is api.matrixpaysolution.com (api.matrix.center
  // sits behind a WAF that resets anonymous TCP connections — useless as a
  // health signal). POST to /v1/project/details with no api_key returns a
  // structured 401/422 in ~20ms when the gateway is healthy.
  return probe("https://api.matrixpaysolution.com/v1/project/details", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ api_key: "" }),
    healthyStatuses: [400, 401, 403, 404, 422],
    timeoutMs: 6000,
  });
}

async function fetchLastError(admin: any, provider: string) {
  const { data } = await admin
    .from("provider_events")
    .select("id, transaction_id, created_at, event_type, payload")
    .eq("provider", provider)
    .or("event_type.ilike.%fail%,event_type.ilike.%error%,event_type.ilike.%declin%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const p: any = data.payload ?? {};
  const summary = p?.error?.message || p?.gateway_message || p?.message || data.event_type || "Unknown error";
  return {
    event_id: data.id,
    transaction_id: data.transaction_id ?? null,
    occurred_at: data.created_at,
    summary: String(summary).slice(0, 280),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const HS = [200, 400, 401, 403, 404, 405, 422];
  const [
    shieldRes, mondoRes, matrixRes, routesRes,
    plaidRes, circleRes, elektropayRes, makapayRes, paygate10Res, prometeoRes,
    pacopayRes, shopifyRes, bigcommerceRes, vgsRes, tapixRes, chargeflowRes,
    resendRes, posthogRes, brightyRes, delosRes, paywatcherRes, platformOsRes,
    paypalRes, googlePayRes, applePayRes,
    shieldErr, mondoErr, matrixErr, plaidErr, circleErr, elektropayErr, makapayErr,
    paygate10Err, prometeoErr,
  ] = await Promise.all([
    probe("https://api.shieldhub.com/", { healthyStatuses: HS }),
    probe("https://server-to-server.getmondo.co/", { healthyStatuses: HS }),
    probeMatrix(),
    probe(`${SUPABASE_URL}/functions/v1/processor-routes`, { healthyStatuses: [401, 404] }),
    probe("https://production.plaid.com/", { healthyStatuses: HS }),
    probe("https://api.circle.com/v1/ping", { healthyStatuses: HS }),
    probe("https://apiv3.elektropay.com/int/assets", { healthyStatuses: HS }),
    probe("https://api.makapay.com/", { healthyStatuses: HS }),
    probe("https://api.paygate10.com/", { healthyStatuses: HS }),
    probe("https://fintech.prometeoapi.net/", { healthyStatuses: HS }),
    probe("https://api.pacopay.com/", { healthyStatuses: HS }),
    probe("https://api.shopify.com/", { healthyStatuses: HS }),
    probe("https://api.bigcommerce.com/", { healthyStatuses: HS }),
    probe("https://api.sandbox.verygoodvault.com/", { healthyStatuses: HS }),
    probe("https://api.tapix.io/", { healthyStatuses: HS }),
    probe("https://api.chargeflow.io/", { healthyStatuses: HS }),
    probe("https://api.resend.com/", { healthyStatuses: HS }),
    probe("https://us.i.posthog.com/", { healthyStatuses: HS }),
    probe("https://api.brighty.app/", { healthyStatuses: HS }),
    probe("https://api.delos.com/", { healthyStatuses: HS }),
    probe("https://api.paywatcher.com/", { healthyStatuses: HS }),
    probe("https://api.platform.os/", { healthyStatuses: HS }),
    probe("https://api-m.paypal.com/v1/oauth2/token", { method: "POST", healthyStatuses: HS }),
    probe("https://pay.google.com/about/", { healthyStatuses: HS }),
    probe("https://www.apple.com/apple-pay/", { healthyStatuses: HS }),
    fetchLastError(admin, "shieldhub").catch(() => null),
    fetchLastError(admin, "mondo").catch(() => null),
    fetchLastError(admin, "matrix").catch(() => null),
    fetchLastError(admin, "plaid").catch(() => null),
    fetchLastError(admin, "circle").catch(() => null),
    fetchLastError(admin, "elektropay").catch(() => null),
    fetchLastError(admin, "makapay").catch(() => null),
    fetchLastError(admin, "paygate10").catch(() => null),
    fetchLastError(admin, "prometeo").catch(() => null),
  ]);

  const classify = (p: { status: number | null; ok: boolean }): ProbeResult["status"] => {
    if (p.status === null) return "down";
    if (!p.ok) return "down";
    return "healthy";
  };

  const mk = (id: string, label: string, p: any, msg?: string, last_error: any = null): ProbeResult => ({
    id, label,
    status: classify(p),
    http_status: p.status,
    latency_ms: p.latencyMs,
    message: (p as any).error ?? (p.status === null ? "Unreachable" : (msg || `HTTP ${p.status}`)),
    last_error,
  });

  const results: ProbeResult[] = [
    {
      id: "shieldhub",
      label: "ShieldHub (Primary card)",
      status: classify(shieldRes),
      http_status: shieldRes.status,
      latency_ms: shieldRes.latencyMs,
      message: (shieldRes as any).error ?? (shieldRes.status === null ? "Unreachable" : `HTTP ${shieldRes.status}`),
      last_error: shieldErr,
    },
    {
      id: "matrix",
      label: "Matrix Partners (H2H/Oneclick)",
      status: classify(matrixRes),
      http_status: matrixRes.status,
      latency_ms: matrixRes.latencyMs,
      message: (matrixRes as any).error
        ?? (matrixRes.status === null
          ? "Unreachable"
          : `HTTP ${matrixRes.status} · POST /v1/project/details (auth-rejected = healthy)`),
      last_error: matrixErr,
    },
    {
      id: "open_banking",
      label: "Open Banking (Mondo · EU/UK)",
      status: classify(mondoRes),
      http_status: mondoRes.status,
      latency_ms: mondoRes.latencyMs,
      message: (mondoRes as any).error ?? (mondoRes.status === null ? "Unreachable" : `HTTP ${mondoRes.status}`),
      last_error: mondoErr,
    },
    {
      id: "processor_routes",
      label: "processor-routes Edge Function",
      status: routesRes.status === null ? "down" : routesRes.status >= 500 ? "down" : "healthy",
      http_status: routesRes.status,
      latency_ms: routesRes.latencyMs,
      message: (routesRes as any).error ?? (routesRes.status === null ? "Unreachable" : `HTTP ${routesRes.status}`),
      last_error: null,
    },
    mk("plaid", "Plaid (Bank linking · US)", plaidRes, undefined, plaidErr),
    mk("circle", "Circle (USDC settlement)", circleRes, undefined, circleErr),
    mk("elektropay", "Elektropay (Crypto · LATAM/MENA)", elektropayRes, undefined, elektropayErr),
    mk("makapay", "MakaPay (Card · APAC)", makapayRes, undefined, makapayErr),
    mk("paygate10", "Paygate10 (Pakistan PKR)", paygate10Res, undefined, paygate10Err),
    mk("prometeo", "Prometeo (Open Banking · LATAM)", prometeoRes, undefined, prometeoErr),
    mk("pacopay", "PacoPay (Tokenization widget)", pacopayRes),
    mk("shopify", "Shopify (Commerce platform)", shopifyRes),
    mk("bigcommerce", "BigCommerce (Commerce platform)", bigcommerceRes),
    mk("vgs", "VGS (PCI tokenization vault)", vgsRes),
    mk("tapix", "Tapix (Merchant enrichment)", tapixRes),
    mk("chargeflow", "Chargeflow (Dispute automation)", chargeflowRes),
    mk("resend", "Resend (Transactional email)", resendRes),
    mk("posthog", "PostHog (Product analytics)", posthogRes),
    mk("brighty", "Brighty (Banking-as-a-service)", brightyRes),
    mk("delos", "Delos (KYC/AML)", delosRes),
    mk("paywatcher", "Paywatcher (Fraud monitoring)", paywatcherRes),
    mk("platform_os", "Platform OS (Active Merchant gateway)", platformOsRes),
    mk("paypal", "PayPal (Wallet)", paypalRes),
    mk("google_pay", "Google Pay (Wallet)", googlePayRes),
    mk("apple_pay", "Apple Pay (Wallet)", applePayRes),
  ];

  const overall = results.every((r) => r.status === "healthy")
    ? "healthy"
    : results.some((r) => r.status === "down")
      ? "degraded"
      : "healthy";

  return new Response(
    JSON.stringify({ checked_at: new Date().toISOString(), overall, services: results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

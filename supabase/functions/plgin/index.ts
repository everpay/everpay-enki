// Plgin (Plugg and Co) Payments API adapter. Ported from Everpay Platform OS.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ENV = (Deno.env.get("PLGIN_ENV") ?? "sandbox").toLowerCase();
const BASE = Deno.env.get("PLGIN_BASE_URL") ?? (ENV === "live" ? "https://api.plgin.net/v1" : "https://sandbox-api.plgin.net/v1");
const APP_ID = Deno.env.get("PLGIN_APP_ID") ?? "";
const API_KEY = Deno.env.get("PLGIN_API_KEY") ?? "";
const ACCOUNT_UUID = Deno.env.get("PLGIN_ACCOUNT_UUID") ?? "";

function authHeader() { return `Basic ${btoa(`${APP_ID}:${API_KEY}`)}`; }

async function plginFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: authHeader(), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

function customerFromReq(req: any) {
  const c = req.customer ?? {};
  return {
    firstName: c.firstName ?? (c.name?.split(" ")?.[0] ?? "Customer"),
    lastName: c.lastName ?? (c.name?.split(" ").slice(1).join(" ") || "User"),
    email: c.email ?? "noreply@example.com",
    phone: c.phone ?? "",
    ipAddress: c.ipAddress ?? req.ip ?? "0.0.0.0",
    cardData: c.cardData ?? req.cardData ?? undefined,
    address: c.address ?? undefined,
    shippingAddress: c.shippingAddress ?? undefined,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    if (!APP_ID || !API_KEY) return json({ error: "Plgin credentials missing (PLGIN_APP_ID / PLGIN_API_KEY)" }, 503);
    const accountUuid = req.headers.get("x-plgin-account") || ACCOUNT_UUID;
    if (!accountUuid) return json({ error: "Plgin account UUID missing" }, 400);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "deposit";

    if (action === "deposit") {
      const payload = {
        paymentMethod: body.paymentMethod ?? "CreditCard",
        paymentType: body.paymentType ?? "Visa",
        transactionType: body.transactionType ?? "Sale",
        customerRedirect: body.return_url ?? body.customerRedirect,
        amount: Number(body.amount ?? 0),
        channel: body.channel ?? "ECommerce",
        currency: (body.currency ?? "USD").toUpperCase(),
        description: body.description ?? body.reference ?? "",
        customer: customerFromReq(body),
      };
      const { data, status } = await plginFetch(`/payments/${accountUuid}/transactions`, { method: "POST", body: JSON.stringify(payload) });
      const t = data?.body ?? data;
      return json({
        id: t?.uuid ?? null, transaction_id: t?.uuid ?? null,
        status: t?.status ?? "Pending", redirect_url: t?.redirect ?? undefined,
        amount: t?.amount, currency: t?.currency, raw: data,
      }, status);
    }

    if (action === "refund" || action === "cancel" || action === "query") {
      const ref = body.provider_ref;
      if (!ref) return json({ error: "provider_ref required" }, 400);
      const suffix = action === "query" ? "" : `/${action}`;
      const method = action === "query" ? "GET" : "POST";
      const { data, status } = await plginFetch(`/payments/${accountUuid}/transactions/${ref}${suffix}`, { method, body: method === "POST" ? "{}" : undefined });
      const t = data?.body ?? data;
      return json({ id: t?.uuid, status: t?.status, raw: data }, status);
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e: any) {
    console.error("plgin error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
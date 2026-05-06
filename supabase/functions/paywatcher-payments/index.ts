import { corsHeaders } from "@supabase/supabase-js/cors";

const API_BASE = "https://api.masem.at/v1";
const DEPOSIT_ADDRESS = "0xCFac1fAD4dEEFFd863FBc26f7211Ace15F12219b";
const COST_USDC = 0.05;       // PayWatcher cost
const CHARGE_USDC = 0.50;     // What we charge merchants
const MARKUP_PCT = ((CHARGE_USDC - COST_USDC) / COST_USDC) * 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("PAYWATCHER_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "PAYWATCHER_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "ping";
    const idempotencyKey = req.headers.get("x-idempotency-key") ?? crypto.randomUUID();

    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    };

    if (action === "ping") {
      return json({
        ok: true,
        provider: "paywatcher",
        network: "BASE",
        deposit_address: DEPOSIT_ADDRESS,
        cost_usdc: COST_USDC,
        charge_usdc: CHARGE_USDC,
        markup_pct: MARKUP_PCT.toFixed(0),
      });
    }

    if (action === "create_payment") {
      const { amount, currency = "USDC", merchant_id, metadata } = body;
      if (!amount) return json({ error: "amount required" }, 400);
      const r = await fetch(`${API_BASE}/payments`, {
        method: "POST", headers,
        body: JSON.stringify({
          amount: String(amount), currency,
          metadata: { ...metadata, merchant_id, idempotency_key: idempotencyKey },
        }),
      });
      const data = await r.json();
      // upsell pricing surfaced to caller
      return json({
        ...data,
        pricing: { network_cost_usdc: COST_USDC, fee_usdc: CHARGE_USDC, deposit_address: DEPOSIT_ADDRESS },
      }, r.status);
    }

    if (action === "get_payment") {
      const { id } = body;
      const r = await fetch(`${API_BASE}/payments/${id}`, { headers });
      return json(await r.json(), r.status);
    }

    if (action === "list_payments") {
      const r = await fetch(`${API_BASE}/payments`, { headers });
      return json(await r.json(), r.status);
    }

    if (action === "rates") {
      // upsell sheet for all providers (BASE/USDC focus)
      return json({
        rails: [
          { provider: "paywatcher", network: "BASE", asset: "USDC", cost: 0.05, charge: 0.50, margin_usdc: 0.45 },
          { provider: "circle",     network: "BASE/ETH", asset: "USDC", cost: 0.25, charge: 1.00, margin_usdc: 0.75 },
          { provider: "elektropay", network: "MULTI",   asset: "USDT/USDC", cost: 0.20, charge: 1.00, margin_usdc: 0.80 },
          { provider: "walletsuite",network: "MULTI",   asset: "USDC",      cost: 0.10, charge: 0.75, margin_usdc: 0.65 },
          { provider: "rebelfi",    network: "SOLANA",  asset: "USDC",      cost: 0.01, charge: 0.40, margin_usdc: 0.39 },
        ],
      });
    }

    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }

  function json(obj: unknown, status = 200) {
    return new Response(JSON.stringify(obj), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
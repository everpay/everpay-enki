import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paywatcher-signature',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: corsHeaders });

  const secret = Deno.env.get("PAYWATCHER_WEBHOOK_SECRET");
  const sig = req.headers.get("x-paywatcher-signature") ?? "";
  const raw = await req.text();

  if (secret) {
    if (!sig) {
      return new Response(JSON.stringify({ error: "missing signature header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const macBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
    const mac = Array.from(new Uint8Array(macBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    const provided = sig.replace(/^sha256=/, "").toLowerCase();
    // Constant-time comparison
    let diff = mac.length ^ provided.length;
    for (let i = 0; i < Math.max(mac.length, provided.length); i++) {
      diff |= (mac.charCodeAt(i) || 0) ^ (provided.charCodeAt(i) || 0);
    }
    if (diff !== 0) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const evt = JSON.parse(raw);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const eventType: string = evt.type ?? evt.event ?? "unknown";
  const providerRef: string | null = evt.data?.id ?? evt.id ?? null;

  // Map PayWatcher events → canonical transaction status
  let txStatus: string | null = null;
  if (eventType === "payment.confirmed") txStatus = "completed";
  else if (eventType === "payment.failed") txStatus = "failed";
  else if (eventType === "payment.expired") txStatus = "failed";

  let merchantId: string | null = null;
  let txnId: string | null = null;
  if (providerRef) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("id, merchant_id")
      .eq("provider_ref", String(providerRef))
      .maybeSingle();
    if (tx) { merchantId = tx.merchant_id; txnId = tx.id; }

    if (txStatus && tx) {
      await supabase
        .from("transactions")
        .update({ status: txStatus, updated_at: new Date().toISOString() })
        .eq("id", tx.id);

      // Mirror to payment_intents via metadata link if present
      const intentStatus = txStatus === "completed" ? "succeeded" : "failed";
      await supabase.from("payment_intents")
        .update({ status: intentStatus })
        .eq("processor_id", "paywatcher")
        .eq("merchant_id", merchantId);
    }

    // Append provider event for the timeline
    if (tx) {
      await supabase.from("provider_events").insert({
        merchant_id: merchantId,
        transaction_id: txnId,
        provider: "paywatcher",
        event_type: eventType,
        payload: evt,
      } as never).catch(() => null);
    }

    // Fan out canonical webhook to merchant subscribers
    if (merchantId && txStatus) {
      const fanoutEvent = txStatus === "completed" ? "payment.completed" : "payment.failed";
      supabase.functions.invoke("api-v2-webhooks", {
        body: {
          merchant_id: merchantId,
          event_type: fanoutEvent,
          payload: { payment_id: txnId, provider: "paywatcher", provider_ref: providerRef, status: txStatus, raw: evt.data ?? evt },
        },
      }).catch((e) => console.error("paywatcher fanout error:", e));
    }
  }

  await supabase.from("everpay_webhooks").insert({
    provider: "paywatcher",
    event_type: eventType,
    transaction_id: providerRef,
    status: evt.data?.status ?? evt.status ?? null,
    payload: evt,
    processed: !!txStatus,
  } as never).catch(() => null);

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
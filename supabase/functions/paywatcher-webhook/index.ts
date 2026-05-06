import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: corsHeaders });

  const secret = Deno.env.get("PAYWATCHER_WEBHOOK_SECRET");
  const sig = req.headers.get("x-paywatcher-signature") ?? "";
  const raw = await req.text();

  if (secret) {
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const macBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
    const mac = Array.from(new Uint8Array(macBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (mac !== sig.replace(/^sha256=/, "")) {
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

  await supabase.from("everpay_webhooks").insert({
    provider: "paywatcher",
    event_type: evt.type ?? evt.event ?? "unknown",
    transaction_id: evt.data?.id ?? evt.id ?? null,
    status: evt.data?.status ?? evt.status ?? null,
    payload: evt,
  } as never).catch(() => null);

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
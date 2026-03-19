import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { merchant_id, event_type, payload } = await req.json();

    if (!merchant_id || !event_type) {
      return new Response(JSON.stringify({ error: "merchant_id and event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active webhook endpoints for this merchant that subscribe to this event
    const { data: endpoints, error: epError } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("merchant_id", merchant_id)
      .eq("active", true);

    if (epError) throw epError;

    const results = [];

    for (const endpoint of endpoints || []) {
      // Check if endpoint subscribes to this event
      const events = endpoint.events as string[];
      if (events.length > 0 && !events.includes(event_type)) continue;

      // Create HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(endpoint.secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const payloadStr = JSON.stringify({ event: event_type, data: payload, timestamp: new Date().toISOString() });
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
      const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

      let deliveryStatus = "pending";
      let responseStatus = null;
      let responseBody = null;

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signatureHex,
            "X-Webhook-Event": event_type,
          },
          body: payloadStr,
        });
        responseStatus = response.status;
        responseBody = await response.text().catch(() => null);
        deliveryStatus = response.ok ? "delivered" : "failed";
      } catch (fetchErr) {
        deliveryStatus = "failed";
        responseBody = fetchErr.message;
      }

      // Log delivery
      await supabase.from("webhook_deliveries").insert({
        endpoint_id: endpoint.id,
        merchant_id,
        event_type,
        payload: { event: event_type, data: payload },
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 1000),
        status: deliveryStatus,
        delivered_at: deliveryStatus === "delivered" ? new Date().toISOString() : null,
      });

      results.push({ endpoint_id: endpoint.id, status: deliveryStatus, response_status: responseStatus });
    }

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

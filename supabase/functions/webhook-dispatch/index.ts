import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = getBearerToken(req);
  if (!token) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON payload" });
    }

    if (!isRecord(body)) {
      return jsonResponse(400, { error: "Invalid request body" });
    }

    const merchant_id =
      typeof body.merchant_id === "string" ? body.merchant_id.trim() : "";
    const event_type =
      typeof body.event_type === "string" ? body.event_type.trim() : "";
    const payload = isRecord(body.payload) ? body.payload : {};

    if (!merchant_id || !event_type) {
      return jsonResponse(400, { error: "merchant_id and event_type required" });
    }

    if (!UUID_REGEX.test(merchant_id)) {
      return jsonResponse(400, { error: "Invalid merchant_id format" });
    }

    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("id")
      .eq("id", merchant_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (merchantError || !merchant) {
      return jsonResponse(403, { error: "Forbidden" });
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

       if (!endpoint.secret || typeof endpoint.secret !== "string") {
        results.push({
          endpoint_id: endpoint.id,
          status: "failed",
          response_status: null,
        });
        continue;
      }

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
        responseBody = fetchErr instanceof Error ? fetchErr.message : "Delivery request failed";
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
    console.error("Webhook dispatch error:", err);
    return jsonResponse(500, { error: "Internal server error" });
  }
});

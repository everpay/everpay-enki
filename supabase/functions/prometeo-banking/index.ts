import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMETEO_BASE = "https://payment.prometeoapi.net/api/v1";
const PROMETEO_BANKING = "https://banking.prometeoapi.net";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("PROMETEO_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Prometeo API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      // ─── Create Payment Intent ─────────────────────────
      case "create_payment_intent": {
        const body = await req.json();
        const { product_id, amount, currency, concept, return_url, external_id } = body;

        const res = await fetch(`${PROMETEO_BASE}/payment-intent/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify({
            product_id,
            product_type: "widget",
            amount: String(amount),
            currency: currency?.toUpperCase() || "USD",
            concept: concept || "Payment",
            external_id: external_id || null,
          }),
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── Get Payment Intent Status ─────────────────────
      case "get_payment_intent": {
        const intentId = url.searchParams.get("intent_id");
        if (!intentId) {
          return new Response(
            JSON.stringify({ error: "intent_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const res = await fetch(`${PROMETEO_BASE}/payment-intent/${intentId}/`, {
          headers: { "X-API-Key": apiKey },
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── List Available Providers/Banks ─────────────────
      case "list_providers": {
        const country = url.searchParams.get("country") || "";
        const providerUrl = country
          ? `${PROMETEO_BANKING}/provider/?country=${country}`
          : `${PROMETEO_BANKING}/provider/`;

        const res = await fetch(providerUrl, {
          headers: { "X-API-Key": apiKey },
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", valid_actions: ["create_payment_intent", "get_payment_intent", "list_providers"] }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

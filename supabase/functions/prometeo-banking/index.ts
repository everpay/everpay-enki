import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prometeo Borderless API endpoints
const PAYMENT_BASE = "https://payment.prometeoapi.net/api/v1";
const BANKING_BASE = "https://banking.prometeoapi.net";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("PROMETEO_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "Prometeo API key not configured" }, 500);
    }

    // ─── Auth validation ───────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const prometeoHeaders = {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    };

    switch (action) {
      // ═══════════════════════════════════════════════════
      // PAY-INS: Payment Intent Flow (Widget-based)
      // Flow: Create Intent → Customer redirected to widget → Bank auth → Webhook confirmation
      // ═══════════════════════════════════════════════════

      case "create_payment_intent": {
        const body = await req.json();
        const { product_id, amount, currency, concept, external_id, reference, username, document_number } = body;

        if (!product_id || !amount || !currency) {
          return jsonResponse({ error: "product_id, amount, and currency are required" }, 400);
        }

        const res = await fetch(`${PAYMENT_BASE}/payment-intent/`, {
          method: "POST",
          headers: prometeoHeaders,
          body: JSON.stringify({
            product_id,
            product_type: "widget",
            amount: String(amount),
            currency: currency.toUpperCase(),
            concept: concept || "Payment via Everpay",
            external_id: external_id || null,
            reference: reference || null,
            username: username || null,
            document_number: document_number || null,
          }),
        });

        const data = await res.json();

        // Log the payment intent for reconciliation
        if (res.ok && data.id) {
          await supabase.from("event_logs").insert({
            event_type: "prometeo.payment_intent.created",
            source_service: "prometeo-banking",
            payload: { intent_id: data.id, amount, currency, external_id },
          });
        }

        return jsonResponse(data, res.status);
      }

      case "get_payment_intent": {
        const intentId = url.searchParams.get("intent_id");
        if (!intentId) {
          return jsonResponse({ error: "intent_id required" }, 400);
        }

        const res = await fetch(`${PAYMENT_BASE}/payment-intent/${intentId}/`, {
          headers: prometeoHeaders,
        });

        return jsonResponse(await res.json(), res.status);
      }

      // ═══════════════════════════════════════════════════
      // BANKING: Provider & Account Access
      // For bank redirect flows — list banks, login, get accounts
      // ═══════════════════════════════════════════════════

      case "list_providers": {
        const country = url.searchParams.get("country");
        const providerUrl = country
          ? `${BANKING_BASE}/provider/?country=${country}`
          : `${BANKING_BASE}/provider/`;

        const res = await fetch(providerUrl, {
          headers: { "X-API-Key": apiKey },
        });

        return jsonResponse(await res.json(), res.status);
      }

      case "bank_login": {
        const body = await req.json();
        const { provider, username, password, type } = body;

        if (!provider || !username || !password) {
          return jsonResponse({ error: "provider, username, and password are required" }, 400);
        }

        const formData = new URLSearchParams();
        formData.append("provider", provider);
        formData.append("username", username);
        formData.append("password", password);
        if (type) formData.append("type", type);

        const res = await fetch(`${BANKING_BASE}/login/`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const data = await res.json();
        return jsonResponse(data, res.status);
      }

      case "list_accounts": {
        const sessionKey = url.searchParams.get("session_key");
        if (!sessionKey) {
          return jsonResponse({ error: "session_key required" }, 400);
        }

        const res = await fetch(`${BANKING_BASE}/account/?key=${sessionKey}`, {
          headers: { "X-API-Key": apiKey },
        });

        return jsonResponse(await res.json(), res.status);
      }

      // ═══════════════════════════════════════════════════
      // TRANSFERS: Pre-process & Confirm (Pay-outs)
      // Flow: Pre-process → OTP/confirmation → Confirm
      // ═══════════════════════════════════════════════════

      case "transfer_preprocess": {
        const body = await req.json();
        const { session_key, origin_account, destination_institution, destination_account, currency, amount, concept, destination_owner_name, branch } = body;

        if (!session_key || !origin_account || !destination_account || !amount) {
          return jsonResponse({ error: "session_key, origin_account, destination_account, and amount are required" }, 400);
        }

        const formData = new URLSearchParams();
        formData.append("key", session_key);
        formData.append("origin_account", origin_account);
        formData.append("destination_institution", destination_institution || "");
        formData.append("destination_account", destination_account);
        formData.append("currency", currency || "USD");
        formData.append("amount", String(amount));
        formData.append("concept", concept || "Everpay payout");
        if (destination_owner_name) formData.append("destination_owner_name", destination_owner_name);
        if (branch) formData.append("branch", branch);

        const res = await fetch(`${BANKING_BASE}/transfer/preprocess/`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        return jsonResponse(await res.json(), res.status);
      }

      case "transfer_confirm": {
        const body = await req.json();
        const { session_key, request_id, authorization_type, authorization_data } = body;

        if (!session_key || !request_id) {
          return jsonResponse({ error: "session_key and request_id are required" }, 400);
        }

        const formData = new URLSearchParams();
        formData.append("key", session_key);
        formData.append("request_id", request_id);
        if (authorization_type) formData.append("authorization_type", authorization_type);
        if (authorization_data) formData.append("authorization_data", authorization_data);

        const res = await fetch(`${BANKING_BASE}/transfer/confirm/`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const data = await res.json();

        // Log successful transfers
        if (res.ok) {
          await supabase.from("event_logs").insert({
            event_type: "prometeo.transfer.confirmed",
            source_service: "prometeo-banking",
            payload: { request_id, session_key: "***" },
          });
        }

        return jsonResponse(data, res.status);
      }

      // ═══════════════════════════════════════════════════
      // BALANCE & MOVEMENTS
      // ═══════════════════════════════════════════════════

      case "get_balance": {
        const sessionKey = url.searchParams.get("session_key");
        const account = url.searchParams.get("account");
        if (!sessionKey || !account) {
          return jsonResponse({ error: "session_key and account required" }, 400);
        }

        const res = await fetch(
          `${BANKING_BASE}/account/${account}/balance/?key=${sessionKey}`,
          { headers: { "X-API-Key": apiKey } }
        );

        return jsonResponse(await res.json(), res.status);
      }

      case "get_movements": {
        const sessionKey = url.searchParams.get("session_key");
        const account = url.searchParams.get("account");
        const dateFrom = url.searchParams.get("date_from");
        const dateTo = url.searchParams.get("date_to");

        if (!sessionKey || !account) {
          return jsonResponse({ error: "session_key and account required" }, 400);
        }

        let movUrl = `${BANKING_BASE}/account/${account}/movement/?key=${sessionKey}`;
        if (dateFrom) movUrl += `&date_from=${dateFrom}`;
        if (dateTo) movUrl += `&date_to=${dateTo}`;

        const res = await fetch(movUrl, {
          headers: { "X-API-Key": apiKey },
        });

        return jsonResponse(await res.json(), res.status);
      }

      // ═══════════════════════════════════════════════════
      // LOGOUT
      // ═══════════════════════════════════════════════════

      case "logout": {
        const sessionKey = url.searchParams.get("session_key");
        if (!sessionKey) {
          return jsonResponse({ error: "session_key required" }, 400);
        }

        const res = await fetch(`${BANKING_BASE}/logout/?key=${sessionKey}`, {
          headers: { "X-API-Key": apiKey },
        });

        return jsonResponse(await res.json(), res.status);
      }

      default:
        return jsonResponse({
          error: "Unknown action",
          valid_actions: [
            "create_payment_intent", "get_payment_intent",
            "list_providers", "bank_login", "list_accounts",
            "transfer_preprocess", "transfer_confirm",
            "get_balance", "get_movements", "logout",
          ],
        }, 400);
    }
  } catch (err) {
    console.error("Prometeo edge function error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});

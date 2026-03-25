import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PACOPAY_GATEWAY_URL = "https://gateway.paco-pay.com";
const PACOPAY_CHECKOUT_URL = "https://payment.paco-pay.com";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pacoShopId = Deno.env.get("PACOPAY_SHOP_ID");
    const pacoSecretKey = Deno.env.get("PACOPAY_SECRET_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, ...params } = body;

    // Base64 auth for PacoPay API
    const authHeader = `Basic ${btoa(`${pacoShopId}:${pacoSecretKey}`)}`;

    switch (action) {
      // ─── Create payment token for widget ─────────────────────
      case "create_token": {
        const { amount, currency, description, merchant_id, tracking_id, notification_url, success_url, fail_url } = params;

        const tokenReq = {
          checkout: {
            test: params.test_mode ?? false,
            transaction_type: "payment",
            order: {
              amount: Math.round(amount * 100), // Convert to minimal units
              currency: currency || "USD",
              description: description || "Payment",
              tracking_id: tracking_id,
            },
            settings: {
              success_url,
              decline_url: fail_url,
              fail_url,
              notification_url,
              language: params.locale || "en",
              customer_fields: { visible: ["email"] },
            },
          },
        };

        const resp = await fetch(`${PACOPAY_CHECKOUT_URL}/ctp/api/checkouts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(tokenReq),
        });

        const data = await resp.json();

        return new Response(JSON.stringify({
          token: data.checkout?.token,
          redirect_url: data.checkout?.redirect_url,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Card payment (direct API — requires PCI DSS) ────────
      case "card_payment": {
        const { amount, currency, description, card, customer, tracking_id } = params;

        const payReq = {
          request: {
            amount: Math.round(amount * 100),
            currency,
            description,
            tracking_id,
            test: params.test_mode ?? false,
            credit_card: {
              number: card.number,
              holder: card.holder,
              exp_month: card.exp_month,
              exp_year: card.exp_year,
              verification_value: card.cvv,
            },
            customer: {
              ip: customer?.ip || "127.0.0.1",
              email: customer?.email,
            },
          },
        };

        const resp = await fetch(`${PACOPAY_GATEWAY_URL}/transactions/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(payReq),
        });

        const data = await resp.json();

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── APM payment ─────────────────────────────────────────
      case "apm_payment": {
        const { amount, currency, description, payment_method, customer, tracking_id, notification_url, return_url } = params;

        const apmReq = {
          request: {
            amount: Math.round(amount * 100),
            currency,
            description,
            tracking_id,
            test: params.test_mode ?? false,
            payment_method_type: payment_method, // e.g. "apple_pay", "google_pay", "ideal", etc.
            customer: {
              ip: customer?.ip || "127.0.0.1",
              email: customer?.email,
            },
            notification_url,
            return_url,
          },
        };

        const resp = await fetch(`${PACOPAY_GATEWAY_URL}/transactions/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(apmReq),
        });

        const data = await resp.json();

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── Payout to card ──────────────────────────────────────
      case "payout_to_card": {
        const { amount, currency, description, card, recipient, tracking_id } = params;

        const payoutReq = {
          request: {
            amount: Math.round(amount * 100),
            currency,
            description,
            tracking_id,
            test: params.test_mode ?? false,
            recipient_credit_card: {
              number: card.number,
              holder: card.holder,
              exp_month: card.exp_month,
              exp_year: card.exp_year,
            },
            recipient: {
              ip: recipient?.ip || "127.0.0.1",
              email: recipient?.email,
            },
          },
        };

        const resp = await fetch(`${PACOPAY_GATEWAY_URL}/transactions/payouts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(payoutReq),
        });

        const data = await resp.json();

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── Transaction status query ────────────────────────────
      case "status": {
        const { uid } = params;

        const resp = await fetch(`${PACOPAY_GATEWAY_URL}/transactions/${uid}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        });

        const data = await resp.json();

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PACOPAY_GATEWAY_URL = "https://gateway.paco-pay.com";

// ─── Rate Limiting (in-memory, per-IP) ─────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 30 requests per minute." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pacoShopId = Deno.env.get("PACOPAY_SHOP_ID");
    const pacoSecretKey = Deno.env.get("PACOPAY_SECRET_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!pacoShopId || !pacoSecretKey) {
      return new Response(JSON.stringify({ error: "PacoPay credentials not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    // Base64 auth for PacoPay API
    const authHeader = `Basic ${btoa(`${pacoShopId}:${pacoSecretKey}`)}`;

    // ─── LIVE CREDENTIALS: Only payout_to_card and status are enabled ───
    const ALLOWED_ACTIONS = ["payout_to_card", "status"];
    if (!ALLOWED_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({
        error: {
          type: "invalid_request_error",
          code: "action_disabled",
          message: `Action '${action}' is not enabled for live credentials. Only payout_to_card (USD) and status queries are permitted.`,
        }
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      // ─── Payout to card (USD only) ──────────────────────────
      case "payout_to_card": {
        const { amount, currency, description, card, recipient, tracking_id } = params;

        // Enforce USD-only for live payouts
        if (currency && currency.toUpperCase() !== "USD") {
          return new Response(JSON.stringify({
            error: {
              type: "invalid_request_error",
              code: "currency_not_supported",
              message: "Live PacoPay payouts are only enabled for USD currency.",
            }
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validate required card fields
        if (!card?.number || !card?.holder || !card?.exp_month || !card?.exp_year) {
          return new Response(JSON.stringify({
            error: {
              type: "invalid_request_error",
              code: "missing_card_details",
              message: "Card number, holder, exp_month, and exp_year are required.",
            }
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({
            error: {
              type: "invalid_request_error",
              code: "invalid_amount",
              message: "Amount must be a positive number.",
            }
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const payoutReq = {
          request: {
            amount: Math.round(amount * 100),
            currency: "USD",
            description: description || "Payout",
            tracking_id,
            test: false,
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

        // Sanitize response — never leak raw gateway errors
        return new Response(JSON.stringify({
          object: "payout",
          status: data?.transaction?.status || "unknown",
          uid: data?.transaction?.uid || null,
          tracking_id: data?.transaction?.tracking_id || tracking_id,
          amount,
          currency: "USD",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── Transaction status query ────────────────────────────
      case "status": {
        const { uid } = params;

        if (!uid || typeof uid !== "string") {
          return new Response(JSON.stringify({
            error: {
              type: "invalid_request_error",
              code: "missing_uid",
              message: "Transaction UID is required.",
            }
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const resp = await fetch(`${PACOPAY_GATEWAY_URL}/transactions/${uid}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        });

        const data = await resp.json();

        return new Response(JSON.stringify({
          object: "transaction_status",
          uid,
          status: data?.transaction?.status || "unknown",
        }), {
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
    // Never leak internal error details
    console.error("PacoPay error:", error);
    return new Response(JSON.stringify({ error: { type: "api_error", message: "An internal error occurred." } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function gatewayBase(env: string) {
  return env === "live"
    ? "https://gateway.itspaid.global"
    : "https://sandbox-gateway.itspaid.global";
}

async function postForm(url: string, params: Record<string, string | number | undefined>) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") body.append(k, String(v));
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: merchant } = await admin
      .from("merchants").select("id").eq("user_id", user.id).maybeSingle();
    if (!merchant) return json({ error: "Merchant not found" }, 404);

    const { data: settings } = await admin
      .from("itspaid_settings").select("*").eq("merchant_id", merchant.id).maybeSingle();

    const env = settings?.environment || Deno.env.get("ITSPAID_ENV") || "sandbox";
    const base = gatewayBase(env);
    const CORPORATE_ACCOUNT_ID = Deno.env.get("ITSPAID_CORPORATE_ACCOUNT_ID");
    const GATEWAY_API_KEY = Deno.env.get("ITSPAID_GATEWAY_API_KEY");
    if (!CORPORATE_ACCOUNT_ID || !GATEWAY_API_KEY) {
      return json({ error: "ItsPaid credentials not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    switch (action) {
      case "balance": {
        const r = await postForm(`${base}/get_account_balance.api`, {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
        });
        return json({ environment: env, ...r.data }, r.ok ? 200 : r.status);
      }
      case "list": {
        const r = await postForm(`${base}/list_transactions.api`, {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
          TRANSACTION_ID: body.transaction_id,
          TRANSACTION_DIRECTION: body.direction || "OUTGOING",
          LIST_ORDER: body.order || "DESCENDING",
          DATETIME_START: body.datetime_start,
          DATETIME_END: body.datetime_end,
        });
        return json({ environment: env, ...r.data }, r.ok ? 200 : r.status);
      }
      case "cancel": {
        const { transfer_id, itspaid_transaction_id } = body;
        if (!itspaid_transaction_id) return json({ error: "itspaid_transaction_id required" }, 400);
        const r = await postForm(`${base}/cancel_transaction.api`, {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
          TRANSACTION_ID: itspaid_transaction_id,
        });
        if (r.ok && transfer_id) {
          await admin.from("itspaid_transfers").update({
            status: r.data?.TRANSACTION_STATUS || "CANCELED",
            gateway_message: r.data?.GATEWAY_MESSAGE,
            gateway_error: r.data?.GATEWAY_ERROR,
            raw_response: r.data,
          }).eq("id", transfer_id).eq("merchant_id", merchant.id);
        }
        return json({ environment: env, ...r.data }, r.ok ? 200 : r.status);
      }
      case "send": {
        const {
          send_method = "ACH", currency = "USD", amount,
          recipient_full_name, recipient_first_name, recipient_last_name,
          recipient_bank_account, recipient_bank_routing,
          notification_type = 0, recipient_email,
          recipient_phone_country = "US", recipient_phone_number,
          public_description, admin_message,
          transfer_method = "Default", plaid_account_id,
        } = body;

        if (!amount || !recipient_full_name || !recipient_bank_account || !recipient_bank_routing) {
          return json({ error: "amount, recipient_full_name, recipient_bank_account, recipient_bank_routing required" }, 400);
        }
        const params: Record<string, string | number> = {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
          SEND_METHOD: send_method,
          SEND_CURRENCY_ISO3: currency,
          SEND_AMOUNT: amount,
          RECIPIENT_FULL_NAME: recipient_full_name,
          RECIPIENT_BANK_ACCOUNT: recipient_bank_account,
          RECIPIENT_BANK_ROUTING: recipient_bank_routing,
          TRANSFER_METHOD: transfer_method,
          NOTIFICATION_TYPE: notification_type,
          PUBLIC_TRANSACTION_DESCRIPTION: public_description ?? "",
          ADMINISTRATIVE_MESSAGE: admin_message ?? "",
        };
        if (recipient_first_name) params.RECIPIENT_FIRST_NAMES = recipient_first_name;
        if (recipient_last_name) params.RECIPIENT_LAST_NAMES = recipient_last_name;
        if (recipient_email) params.RECEIPIENT_EMAIL_ADDRESS = recipient_email;
        if (recipient_phone_number) {
          params.RECIPIENT_TELEPHONE_COUNTRY_ISO2 = recipient_phone_country;
          params.RECIPIENT_TELEPHONE_NUMBER = recipient_phone_number;
        }
        const r = await postForm(`${base}/send_money.api`, params);
        const last4 = String(recipient_bank_account).slice(-4);
        const { data: inserted } = await admin.from("itspaid_transfers").insert({
          merchant_id: merchant.id, user_id: user.id,
          itspaid_transaction_id: r.data?.TRANSACTION_ID || null,
          send_method, currency, amount,
          recipient_full_name, recipient_email, recipient_phone: recipient_phone_number,
          recipient_bank_account_last4: last4, recipient_bank_routing,
          plaid_account_id, transfer_method,
          public_description, admin_message,
          status: r.data?.TRANSACTION_STATUS || (r.ok ? "INITIATED" : "FAILED"),
          gateway_message: r.data?.GATEWAY_MESSAGE,
          gateway_error: r.data?.GATEWAY_ERROR,
          fees: {
            send_fee_fixed: r.data?.SEND_FEE_FIXED_AMOUNT,
            send_fee_percentage: r.data?.SEND_FEE_PERCENTAGE,
            send_fee_total: r.data?.SEND_FEE_TOTAL_AMOUNT,
          },
          raw_request: { ...params, GATEWAY_API_KEY: "***", CORPORATE_ACCOUNT_ID: "***" },
          raw_response: r.data, environment: env,
        }).select().single();
        return json({ environment: env, transfer: inserted, ...r.data }, r.ok ? 200 : r.status);
      }
      case "get_settings": {
        return json({ settings, environment: env });
      }
      case "save_settings": {
        const { environment: newEnv, enabled, default_send_method, default_notification_type, webhook_url } = body;
        const payload: any = { merchant_id: merchant.id };
        if (newEnv) payload.environment = newEnv;
        if (typeof enabled === "boolean") payload.enabled = enabled;
        if (default_send_method) payload.default_send_method = default_send_method;
        if (typeof default_notification_type === "number") payload.default_notification_type = default_notification_type;
        if (webhook_url !== undefined) payload.webhook_url = webhook_url;
        const { data: saved, error } = await admin
          .from("itspaid_settings").upsert(payload, { onConflict: "merchant_id" })
          .select().single();
        if (error) return json({ error: "An internal error occurred" }, 500);
        return json({ settings: saved });
      }
      case "issue_card": {
        const {
          amount, recipient_full_name, recipient_first_name, recipient_last_name,
          recipient_email, recipient_account_id,
          notification_type = 0, priority_level = 1,
          public_description, admin_message,
        } = body;
        if (!amount || !recipient_full_name || !recipient_email || !recipient_first_name || !recipient_last_name) {
          return json({ error: "amount, recipient_full_name, recipient_first_name, recipient_last_name, recipient_email required" }, 400);
        }
        const params: Record<string, string | number> = {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
          SEND_METHOD: "CARD_VIRTUAL", SEND_CURRENCY_ISO3: "USD", SEND_AMOUNT: amount,
          RECIPIENT_FULL_NAME: recipient_full_name,
          RECIPIENT_FIRST_NAMES: recipient_first_name,
          RECIPIENT_LAST_NAMES: recipient_last_name,
          RECIPIENT_EMAILADDRESS: recipient_email,
          RECEIPIENT_EMAIL_ADDRESS: recipient_email,
          RECIPIENT_MANAGEMENT: "API", TRANSFER_METHOD: "Default",
          NOTIFICATION_TYPE: notification_type, PRIORITY_LEVEL: priority_level,
          PUBLIC_TRANSACTION_DESCRIPTION: public_description ?? "Card load",
          CORPORATE_ADMINISTRATIVE_MESSAGE: admin_message ?? "",
        };
        if (recipient_account_id) params.RECIPIENT_ACCOUNT_ID = recipient_account_id;
        const r = await postForm(`${base}/send_money.api`, params);
        const last4 = r.data?.RECIPIENT_CARD_NUMBER ? String(r.data.RECIPIENT_CARD_NUMBER).slice(-4) : null;
        const { data: card } = await admin.from("itspaid_cards").insert({
          merchant_id: merchant.id, user_id: user.id,
          card_account_id: r.data?.CARD_ACCOUNT_ID || null,
          recipient_account_id: r.data?.RECIPIENT_ACCOUNT_ID || recipient_account_id || null,
          recipient_full_name, recipient_email,
          card_last4: last4,
          card_expiration: r.data?.RECIPIENT_CARD_EXPIRATION_DATE ? String(r.data.RECIPIENT_CARD_EXPIRATION_DATE).slice(0, 10) : null,
          currency: "USD", balance: r.ok ? amount : 0, initial_load: amount,
          status: r.data?.TRANSACTION_STATUS || (r.ok ? "INITIATED" : "FAILED"),
          itspaid_transaction_id: r.data?.TRANSACTION_ID || null,
          environment: env, raw_response: r.data,
        }).select().single();
        await admin.from("itspaid_transfers").insert({
          merchant_id: merchant.id, user_id: user.id,
          itspaid_transaction_id: r.data?.TRANSACTION_ID || null,
          send_method: "CARD_VIRTUAL", currency: "USD", amount,
          recipient_full_name, recipient_email, transfer_method: "Default",
          public_description, admin_message,
          status: r.data?.TRANSACTION_STATUS || (r.ok ? "INITIATED" : "FAILED"),
          gateway_message: r.data?.GATEWAY_MESSAGE, gateway_error: r.data?.GATEWAY_ERROR,
          raw_response: r.data, environment: env,
        });
        return json({ environment: env, card, ...r.data }, r.ok ? 200 : r.status);
      }
      case "list_cards": {
        const r = await postForm(`${base}/manage_cards.api`, {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
          SERVICE_ACTION: "GET_CARD_LIST", PRIORITY_LEVEL: 1,
          RECIPIENT_FIRST_NAMES: body.recipient_first_name || "",
          RECIPIENT_LAST_NAMES: body.recipient_last_name || "",
        });
        return json({ environment: env, ...r.data }, r.ok ? 200 : r.status);
      }
      case "card_details": {
        const { card_account_id, recipient_first_name = "", recipient_last_name = "" } = body;
        if (!card_account_id) return json({ error: "card_account_id required" }, 400);
        const r = await postForm(`${base}/manage_cards.api`, {
          CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
          SERVICE_ACTION: "GET_CARD_DETAILS",
          CARD_ACCOUNT_ID: card_account_id,
          RECIPIENT_FIRST_NAMES: recipient_first_name,
          RECIPIENT_LAST_NAMES: recipient_last_name,
          PRIORITY_LEVEL: 1,
        });
        if (r.ok) {
          await admin.from("itspaid_cards").update({
            balance: r.data?.CARD_BALANCE ?? undefined,
            status: r.data?.CARD_STATUS ?? undefined,
            raw_response: r.data,
          }).eq("card_account_id", card_account_id).eq("merchant_id", merchant.id);
        }
        return json({ environment: env, ...r.data }, r.ok ? 200 : r.status);
      }
      default:
        return json({ error: "Unknown action", valid_actions: ["send","cancel","list","balance","get_settings","save_settings","issue_card","list_cards","card_details"] }, 400);
    }
  } catch (e) {
    console.error("itspaid-ach error:", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function gatewayBase(env: string) {
  return env === "live" ? "https://gateway.itspaid.global" : "https://sandbox-gateway.itspaid.global";
}
async function postForm(url: string, params: Record<string, string | number | undefined>) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") body.append(k, String(v));
  }
  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: merchant } = await admin.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
    if (!merchant) return json({ error: "Merchant not found" }, 404);
    const { data: settings } = await admin.from("itspaid_settings").select("*").eq("merchant_id", merchant.id).maybeSingle();
    const env = settings?.environment || Deno.env.get("ITSPAID_ENV") || "sandbox";
    const base = gatewayBase(env);
    const CORPORATE_ACCOUNT_ID = Deno.env.get("ITSPAID_CORPORATE_ACCOUNT_ID");
    const GATEWAY_API_KEY = Deno.env.get("ITSPAID_GATEWAY_API_KEY");
    if (!CORPORATE_ACCOUNT_ID || !GATEWAY_API_KEY) return json({ error: "ItsPaid credentials not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "balance") {
      const r = await postForm(`${base}/get_account_balance.api`, { CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY });
      return json({ environment: env, ...r.data }, r.ok ? 200 : r.status);
    }
    if (action === "send") {
      const { amount, recipient_full_name, recipient_bank_account, recipient_bank_routing } = body;
      if (!amount || !recipient_full_name || !recipient_bank_account || !recipient_bank_routing) {
        return json({ error: "amount, recipient_full_name, recipient_bank_account, recipient_bank_routing required" }, 400);
      }
      const params: Record<string, string | number> = {
        CORPORATE_ACCOUNT_ID, GATEWAY_API_KEY,
        SEND_METHOD: body.send_method || "ACH",
        SEND_CURRENCY_ISO3: body.currency || "USD",
        SEND_AMOUNT: amount,
        RECIPIENT_FULL_NAME: recipient_full_name,
        RECIPIENT_BANK_ACCOUNT: recipient_bank_account,
        RECIPIENT_BANK_ROUTING: recipient_bank_routing,
        TRANSFER_METHOD: body.transfer_method || "Default",
        NOTIFICATION_TYPE: body.notification_type ?? 0,
      };
      const r = await postForm(`${base}/send_money.api`, params);
      const last4 = String(recipient_bank_account).slice(-4);
      const { data: inserted } = await admin.from("itspaid_transfers").insert({
        merchant_id: merchant.id, user_id: user.id,
        itspaid_transaction_id: r.data?.TRANSACTION_ID || null,
        send_method: params.SEND_METHOD, currency: params.SEND_CURRENCY_ISO3, amount,
        recipient_full_name, recipient_bank_account_last4: last4, recipient_bank_routing,
        transfer_method: params.TRANSFER_METHOD,
        status: r.data?.TRANSACTION_STATUS || (r.ok ? "INITIATED" : "FAILED"),
        gateway_message: r.data?.GATEWAY_MESSAGE, gateway_error: r.data?.GATEWAY_ERROR,
        raw_response: r.data, environment: env,
      }).select().single();
      return json({ environment: env, transfer: inserted, ...r.data }, r.ok ? 200 : r.status);
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("itspaid-ach error:", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
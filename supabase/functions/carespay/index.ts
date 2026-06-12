// CaresPay proxy edge function — pay, rebill, query, batchlist, refund, refundQuery, chargebackQuery.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { carespayCreds, carespayForm, signPay, signQuery } from "../_shared/carespay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Action = "pay" | "rebill" | "query" | "batchlist" | "refund" | "refundQuery" | "chargebackQuery";
const PATHS: Record<Action, string> = {
  pay: "/carespay/pay", rebill: "/carespay/rebill", query: "/query", batchlist: "/query/batchlist",
  refund: "/refund", refundQuery: "/query/refund", chargebackQuery: "/query/CB",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action: Action = body.action;
    if (!action || !(action in PATHS)) return json({ error: "Invalid action" }, 400);

    const channel: "2d" | "3d" = body.channel === "3d" ? "3d" : "2d";
    const { merNo, key } = carespayCreds(channel);
    const fields: Record<string, string> = { ...(body.fields || {}), merNo };

    if (action === "pay") {
      const { billNo, currency, amount, returnURL } = fields;
      if (!billNo || !currency || !amount || !returnURL) return json({ error: "Missing required pay fields" }, 400);
      fields.md5Info = signPay({ merNo, billNo, currency, amount, returnURL, key });
    } else {
      const billNo = fields.billNo || fields.merOrderNo || "";
      fields.signature = signQuery(merNo, billNo, key);
    }

    const { status, data } = await carespayForm(PATHS[action], fields);
    return json(data, status);
  } catch (e) {
    console.error("carespay error:", e);
    return json({ error: "An internal error occurred" }, 500);
  }
});
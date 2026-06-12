// ActiveServer 3DS proxy: covers the standard 3DS2 flow (brw/auth/result).
// Docs: https://docs.activeserver.cloud/en/guides/integration/integration-guide/introduction/
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { asFetch } from "../_shared/activeserver.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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

    const { action, messageCategory = "pa", threeDSServerTransID, payload } = await req.json().catch(() => ({}));
    const defaultMerchant = Deno.env.get("ACTIVESERVER_MERCHANT_ID");
    const body = payload && typeof payload === "object"
      ? { ...(defaultMerchant ? { merchantId: defaultMerchant } : {}), ...payload }
      : undefined;

    let path = "";
    let method: "GET" | "POST" = "POST";
    switch (action) {
      case "initAuth": path = `/api/v2/auth/brw/init/${encodeURIComponent(messageCategory)}`; break;
      case "auth": path = `/api/v2/auth/brw`; break;
      case "result":
        if (!threeDSServerTransID) return json({ error: "threeDSServerTransID required" }, 400);
        path = `/api/v2/auth/brw/result?threeDSServerTransID=${encodeURIComponent(threeDSServerTransID)}`;
        method = "GET"; break;
      case "challenge":
        if (!threeDSServerTransID) return json({ error: "threeDSServerTransID required" }, 400);
        path = `/api/v2/auth/challenge/status?threeDSServerTransID=${encodeURIComponent(threeDSServerTransID)}`;
        method = "GET"; break;
      case "threeRI": path = `/api/v2/auth/3ri/${encodeURIComponent(messageCategory)}`; break;
      case "enrol": path = `/api/v2/auth/enrol`; break;
      default: return json({ error: "Invalid action" }, 400);
    }

    const { status, data } = await asFetch(path, { method, body: method === "GET" ? undefined : JSON.stringify(body || {}) });
    return json(data, status);
  } catch (e) {
    console.error("activeserver-3ds error:", e);
    return json({ error: "An internal error occurred" }, 500);
  }
});
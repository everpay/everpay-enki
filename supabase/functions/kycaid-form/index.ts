import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const KYCAID_API = "https://api.kycaid.com";
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiToken = Deno.env.get("KYCAID_API_TOKEN");
    if (!apiToken) return json({ error: "KYCAID credentials not configured" }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const defaultFormId = Deno.env.get("KYCAID_FORM_ID") || "";
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "get_form_url": {
        const form_id = body.form_id || defaultFormId;
        const { country } = body;
        if (!form_id) return json({ error: "form_id required — set KYCAID_FORM_ID secret or pass form_id" }, 400);
        const formBody: Record<string, string> = { form_id, external_applicant_id: userId };
        const { data: existing } = await supabase
          .from("kyc_verifications").select("provider_applicant_id")
          .eq("user_id", userId).eq("provider", "kycaid")
          .not("provider_applicant_id", "is", null)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (existing?.provider_applicant_id) formBody.applicant_id = existing.provider_applicant_id;

        const res = await fetch(`${KYCAID_API}/forms/${form_id}/urls`, {
          method: "POST",
          headers: { "Authorization": `Token ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(formBody),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("KYCAID form URL error:", data);
          return json({ error: data.message || "Failed to get form URL" }, res.status);
        }
        const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: merchant } = await serviceClient.from("merchants").select("id").eq("user_id", userId).single();
        await serviceClient.from("kyc_verifications").insert({
          user_id: userId, merchant_id: merchant?.id, provider: "kycaid",
          form_url: data.form_url, country: country || null, status: "pending",
          verification_type: body.verification_type || "kyc",
        });
        return json({ form_url: data.form_url });
      }
      case "get_status": {
        const { data: verifications } = await supabase
          .from("kyc_verifications").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        return json({ verification: verifications });
      }
      default:
        return json({ error: "Unknown action", valid_actions: ["get_form_url", "get_status"] }, 400);
    }
  } catch (err) {
    console.error("KYCAID edge function error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
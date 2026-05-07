import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Identify caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return jr({ error: "unauthorized" }, 401);
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return jr({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const provider = String(body.provider || "").trim();
    const currency = String(body.currency || "USD").toUpperCase();
    const amount = Number(body.amount) || 0;
    if (!provider) return jr({ error: "provider required" }, 400);

    // Resolve merchant for this user (admins may pass merchant_id)
    let merchantId: string | null = body.merchant_id || null;
    if (!merchantId) {
      const { data: m } = await admin.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      merchantId = m?.id || null;
    }
    if (!merchantId) return jr({ error: "no_merchant" }, 404);

    // Match: same provider + currency
    let { data: rows } = await admin
      .from("processor_fee_profiles")
      .select("*")
      .eq("merchant_id", merchantId)
      .ilike("provider", provider)
      .eq("currency", currency)
      .limit(1);
    let profile = rows?.[0] ?? null;
    if (!profile) {
      const { data: fb } = await admin
        .from("processor_fee_profiles")
        .select("*")
        .eq("merchant_id", merchantId)
        .ilike("provider", provider)
        .limit(1);
      profile = fb?.[0] ?? null;
    }

    const pct = Number(profile?.percentage_fee ?? 0);
    const fix = Number(profile?.fixed_fee ?? 0);
    const percentageAmount = +(amount * (pct / 100)).toFixed(2);
    const fixedAmount = +fix.toFixed(2);
    const totalFee = +(percentageAmount + fixedAmount).toFixed(2);
    const net = +(amount - totalFee).toFixed(2);

    return jr({
      matched: !!profile,
      profile,
      provider,
      currency,
      amount,
      percentageAmount,
      fixedAmount,
      totalFee,
      net,
    });
  } catch (err: any) {
    return jr({ error: err?.message || "internal_error" }, 500);
  }
});
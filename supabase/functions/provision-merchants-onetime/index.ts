import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// One-time provisioning function - uses service role key internally
// No external auth required - deploy, run once, then delete
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const users = [
    { email: "admin@mzzpay.io", password: "MzzPay2026!", displayName: "MzzPay Admin", merchantName: "MzzPay", providers: ["shieldhub", "makapay"] },
    { email: "richard@rcfitnessflorida.com", password: "RCFitness2026!", displayName: "Richard - RC Fitness", merchantName: "RC Fitness Florida", providers: ["shieldhub"] },
  ];

  const results = [];

  for (const u of users) {
    try {
      const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      let userId: string;
      if (existing) {
        userId = existing.id;
        results.push({ email: u.email, action: "already_exists", userId });
      } else {
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { display_name: u.displayName },
        });
        if (createError) { results.push({ email: u.email, error: createError.message }); continue; }
        userId = newUser.user.id;
        results.push({ email: u.email, action: "created", userId });
      }

      // Ensure profile
      await admin.from("profiles").upsert({ user_id: userId, display_name: u.displayName }, { onConflict: "user_id" });

      // Ensure merchant role
      await admin.from("user_roles").upsert({ user_id: userId, role: "merchant" }, { onConflict: "user_id,role" });

      // Ensure merchant record
      const { data: existingMerchant } = await admin.from("merchants").select("id").eq("user_id", userId).maybeSingle();
      let merchantId: string;
      if (existingMerchant) {
        merchantId = existingMerchant.id;
      } else {
        const { data: newMerchant } = await admin.from("merchants").insert({ user_id: userId, name: u.merchantName }).select("id").single();
        merchantId = newMerchant!.id;
      }

      // ShieldHub primary for all
      await admin.from("psp_routes").upsert(
        { merchant_id: merchantId, processor: "shieldhub", priority: 0, active: true },
        { onConflict: "merchant_id,processor" }
      );
      await admin.from("routing_rules").upsert(
        { merchant_id: merchantId, name: "Default ShieldHub", priority: 0, target_provider: "shieldhub", active: true, currency_match: "{}" },
        { onConflict: "merchant_id,name" }
      );

      // MzzPay: also gets MakaPay fallback
      if (u.providers.includes("makapay")) {
        await admin.from("psp_routes").upsert(
          { merchant_id: merchantId, processor: "makapay", priority: 10, active: true },
          { onConflict: "merchant_id,processor" }
        );
        await admin.from("routing_rules").upsert(
          { merchant_id: merchantId, name: "MakaPay Fallback", priority: 10, target_provider: "makapay", fallback_provider: "shieldhub", active: true, currency_match: "{}" },
          { onConflict: "merchant_id,name" }
        );
      }

      results.push({ email: u.email, merchantId, providers: u.providers, status: "routing_configured" });
    } catch (err) {
      results.push({ email: u.email, error: String(err) });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

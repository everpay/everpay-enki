import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user: caller } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!caller) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
  const isSuperAdmin = callerRoles?.some((r: any) => r.role === "super_admin");
  if (!isSuperAdmin) return new Response("Forbidden", { status: 403, headers: corsHeaders });

  const users = [
    { email: "richard@rcfitnessflorida.com", password: "RCFitness2026!", displayName: "Richard - RC Fitness", merchantName: "RC Fitness Florida" },
    { email: "admin@mzzpay.io", password: "MzzPay2026!", displayName: "MzzPay Admin", merchantName: "MzzPay" },
  ];

  const results = [];

  for (const u of users) {
    // Check if user already exists
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

    // Ensure ShieldHub routing
    await admin.from("psp_routes").upsert(
      { merchant_id: merchantId, processor: "shieldhub", priority: 0, active: true },
      { onConflict: "merchant_id,processor" }
    );
    await admin.from("routing_rules").upsert(
      { merchant_id: merchantId, name: "Default ShieldHub", priority: 0, target_provider: "shieldhub", active: true, currency_match: "{}" },
      { onConflict: "merchant_id,name" }
    );

    // MzzPay also gets MakaPay fallback
    if (u.email === "admin@mzzpay.io") {
      await admin.from("psp_routes").upsert(
        { merchant_id: merchantId, processor: "makapay", priority: 10, active: true },
        { onConflict: "merchant_id,processor" }
      );
      await admin.from("routing_rules").upsert(
        { merchant_id: merchantId, name: "MakaPay Fallback", priority: 10, target_provider: "makapay", fallback_provider: "shieldhub", active: true, currency_match: "{}" },
        { onConflict: "merchant_id,name" }
      );
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

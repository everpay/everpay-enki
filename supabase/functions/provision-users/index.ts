import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Validate provision secret from request body
  let body: any = {};
  try { body = await req.json(); } catch {}
  const provisionSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  const provisionKey = req.headers.get("x-provision-key") || body.provision_key || "";
  
  // Auth: service role key via header, body, or x-provision-key OR super_admin user
  if (token === provisionSecret || provisionKey === provisionSecret) {
    // Service role - allowed
  } else if (token) {
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller } } = await anonClient.auth.getUser(token);
    if (!caller) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const isSuperAdmin = callerRoles?.some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) return new Response("Forbidden", { status: 403, headers: corsHeaders });
  } else {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const action = body.action || "provision";

  // Action: provision-routes-only — add routes to an existing merchant by email
  if (action === "provision-routes") {
    const targetEmail = body.email;
    if (!targetEmail) return new Response(JSON.stringify({ error: "email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const targetUser = existingUsers?.users?.find((u: any) => u.email === targetEmail);
    if (!targetUser) return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: merchant } = await admin.from("merchants").select("id").eq("user_id", targetUser.id).maybeSingle();
    if (!merchant) return new Response(JSON.stringify({ error: "merchant not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const merchantId = merchant.id;
    const routeResults: any[] = [];

    for (const route of (body.routes || [])) {
      const { data, error } = await admin.from("psp_routes").insert({
        merchant_id: merchantId, processor: route.processor, priority: route.priority ?? 0,
        active: route.active ?? true, country: route.country || null,
      }).select();
      routeResults.push({ type: "route", processor: route.processor, data, error: error?.message });
    }

    for (const rule of (body.rules || [])) {
      const { data, error } = await admin.from("routing_rules").insert({
        merchant_id: merchantId, name: rule.name, priority: rule.priority ?? 0,
        target_provider: rule.target_provider, fallback_provider: rule.fallback_provider || null,
        active: rule.active ?? true, currency_match: rule.currency_match || "{}",
      }).select();
      routeResults.push({ type: "rule", name: rule.name, data, error: error?.message });
    }

    // Update existing routes/rules if provided
    for (const upd of (body.updates || [])) {
      const { error } = await admin.from(upd.table).update(upd.set).eq("id", upd.id);
      routeResults.push({ type: "update", table: upd.table, id: upd.id, error: error?.message });
    }

    return new Response(JSON.stringify({ merchantId, results: routeResults }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

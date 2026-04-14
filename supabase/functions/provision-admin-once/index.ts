import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminUsers = [
    { email: "richard.r@everpayinc.com", password: "MathanA1984!", display_name: "Richard R", role: "super_admin", merchant_name: "Everpay Inc" },
    { email: "admin@mzzpay.io", password: "MathanA1984!", display_name: "MzzPay Admin", role: "admin", merchant_name: "MzzPay" },
  ];

  const results: any[] = [];

  for (const u of adminUsers) {
    try {
      const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      let userId: string;
      if (existing) {
        userId = existing.id;
        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
          password: u.password,
          email_confirm: true,
        });
        results.push({ email: u.email, action: "password_reset", userId, error: updateErr?.message });
      } else {
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { display_name: u.display_name },
        });
        if (createError) { results.push({ email: u.email, error: createError.message }); continue; }
        userId = newUser.user.id;
        results.push({ email: u.email, action: "created", userId });
      }

      // Ensure profile
      await admin.from("profiles").upsert({ user_id: userId, display_name: u.display_name }, { onConflict: "user_id" });

      // Assign role
      await admin.from("user_roles").upsert({ user_id: userId, role: u.role }, { onConflict: "user_id,role" });

      // Ensure merchant record
      const { data: existingMerchant } = await admin.from("merchants").select("id").eq("user_id", userId).maybeSingle();
      if (!existingMerchant) {
        await admin.from("merchants").insert({ user_id: userId, name: u.merchant_name });
      }

      // Audit log
      await admin.from("audit_logs").insert({
        user_id: userId,
        action: "admin_provisioned",
        entity_type: "user",
        entity_id: userId,
        metadata: { role: u.role, provisioned_by: "provision-admin-once" },
      });
    } catch (e: any) {
      results.push({ email: u.email, error: e.message });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
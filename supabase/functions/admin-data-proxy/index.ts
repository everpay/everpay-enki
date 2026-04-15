import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Allowed tables for read/write via this proxy
const ALLOWED_TABLES = [
  "profiles",
  "user_roles",
  "merchants",
  "merchant_profiles",
  "merchant_pricing",
  "psp_routes",
  "routing_rules",
  "accounts",
  "transactions",
  "customers",
  "disputes",
  "payment_methods",
  "subscriptions",
  "subscription_plans",
  "invoices",
  "refunds",
  "audit_logs",
  "fee_breakdowns",
  "processors",
  "processor_strategy",
  "processor_fee_profiles",
  "platform_fee_markups",
  "routing_attempt_logs",
  "reseller_splits",
  "elektropay_payments",
  "elektropay_settings",
  "elektropay_wallets",
  "orders",
  "payment_intents",
  "settlement_batches",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // --- Connect to EXTERNAL Everpay Platform OS DB ---
  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!extUrl || !extKey) {
    return jsonResponse({ error: "External database not configured" }, 500);
  }
  const ext = createClient(extUrl, extKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Also create local client for fallback role check ---
  const localUrl = Deno.env.get("SUPABASE_URL")!;
  const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const localAdmin = createClient(localUrl, localServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Auth: verify caller is admin (check BOTH external and local DBs + JWT email fallback) ---
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  if (!token) return jsonResponse({ error: "Auth required" }, 401);

  let callerId: string;
  let callerEmail: string | null = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    callerId = payload.sub;
    callerEmail = payload.email || null;
  } catch {
    return jsonResponse({ error: "Invalid token" }, 401);
  }

  // Known platform admin emails (fallback when DB role checks fail)
  const PLATFORM_ADMIN_EMAILS = [
    "richard.r@everpayinc.com",
    "everpay@gmail.com",
  ];

  // Check external DB first, then fall back to local DB
  const [extRolesRes, localRolesRes] = await Promise.all([
    ext.from("user_roles").select("role").eq("user_id", callerId),
    localAdmin.from("user_roles").select("role").eq("user_id", callerId),
  ]);

  const allRoles = [...(extRolesRes.data || []), ...(localRolesRes.data || [])];
  const isAdmin = allRoles.some(
    (r: any) => r.role === "super_admin" || r.role === "admin"
  ) || (callerEmail && PLATFORM_ADMIN_EMAILS.includes(callerEmail));
  if (!isAdmin) return jsonResponse({ error: "Forbidden" }, 403);

  // --- Parse request ---
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { action, table, filters, data, id, select, order, limit: rowLimit } = body;

  if (!action) return jsonResponse({ error: "action required" }, 400);

  // --- Special actions ---
  if (action === "list_users") {
    // Get all users from external auth + profiles + roles
    const [profilesRes, rolesRes] = await Promise.all([
      ext.from("profiles").select("*").order("created_at", { ascending: false }),
      ext.from("user_roles").select("user_id, role"),
    ]);

    // Also get auth users for email
    const { data: authData } = await ext.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map(
      (authData?.users || []).map((u: any) => [u.id, u.email])
    );

    const roleMap = new Map<string, string[]>();
    (rolesRes.data || []).forEach((r: any) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    const users = (profilesRes.data || []).map((p: any) => ({
      ...p,
      email: emailMap.get(p.user_id) || null,
      roles: roleMap.get(p.user_id) || ["user"],
      role: (roleMap.get(p.user_id) || ["user"])[0],
    }));

    return jsonResponse({ data: users });
  }

  if (action === "list_merchants_full") {
    // Get merchants + profiles + accounts from external
    const [merchantsRes, profilesRes] = await Promise.all([
      ext.from("merchants").select("*").order("created_at", { ascending: false }),
      ext.from("merchant_profiles").select("*"),
    ]);

    // Get auth emails
    const userIds = (merchantsRes.data || []).map((m: any) => m.user_id);
    const { data: authData } = await ext.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map(
      (authData?.users || []).map((u: any) => [u.id, u.email])
    );

    const profileMap = new Map(
      (profilesRes.data || []).map((p: any) => [p.merchant_id, p])
    );

    const merchants = (merchantsRes.data || []).map((m: any) => ({
      ...m,
      email: m.email || emailMap.get(m.user_id) || null,
      profile: profileMap.get(m.id) || null,
      status: profileMap.get(m.id)?.onboarding_status === "approved" ? "active" : "pending",
      onboarding_status: profileMap.get(m.id)?.onboarding_status || "pending",
    }));

    return jsonResponse({ data: merchants });
  }

  if (action === "update_user_role") {
    const { user_id, new_role } = body;
    if (!user_id || !new_role) return jsonResponse({ error: "user_id and new_role required" }, 400);

    // Delete existing roles and insert new one on external DB
    await ext.from("user_roles").delete().eq("user_id", user_id);
    const { error } = await ext.from("user_roles").insert({ user_id, role: new_role });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  }

  if (action === "toggle_user_status") {
    const { user_id, status } = body;
    if (!user_id) return jsonResponse({ error: "user_id required" }, 400);
    const { error } = await ext.from("profiles").update({ status }).eq("user_id", user_id);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  }

  if (action === "delete_user") {
    const { user_id } = body;
    if (!user_id) return jsonResponse({ error: "user_id required" }, 400);
    await ext.from("user_roles").delete().eq("user_id", user_id);
    await ext.from("profiles").delete().eq("user_id", user_id);
    // Optionally delete auth user
    await ext.auth.admin.deleteUser(user_id);
    return jsonResponse({ ok: true });
  }

  // --- Generic CRUD on allowed tables ---
  if (!table || !ALLOWED_TABLES.includes(table)) {
    return jsonResponse({ error: `Invalid or disallowed table: ${table}` }, 400);
  }

  try {
    if (action === "select") {
      let query = ext.from(table).select(select || "*");
      if (filters) {
        for (const [col, val] of Object.entries(filters)) {
          query = query.eq(col, val as any);
        }
      }
      if (order) {
        query = query.order(order.column || "created_at", { ascending: order.ascending ?? false });
      }
      if (rowLimit) query = query.limit(rowLimit);
      const { data: result, error } = await query;
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "insert") {
      if (!data) return jsonResponse({ error: "data required" }, 400);
      const { data: result, error } = await ext.from(table).insert(data).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "update") {
      if (!id || !data) return jsonResponse({ error: "id and data required" }, 400);
      const { data: result, error } = await ext.from(table).update(data).eq("id", id).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "upsert") {
      if (!data) return jsonResponse({ error: "data required" }, 400);
      const onConflict = body.on_conflict || "id";
      const { data: result, error } = await ext.from(table).upsert(data, { onConflict }).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "delete") {
      if (!id) return jsonResponse({ error: "id required" }, 400);
      const { error } = await ext.from(table).delete().eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
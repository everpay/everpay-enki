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

function createServerClient(url: string, key: string, token?: string) {
  return createClient(url, key, {
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Platform OS Gateway fallback — used when EXTERNAL_SUPABASE_SERVICE_ROLE_KEY
// is not available. The gateway lives in the Everpay Platform OS project and
// brokers a small set of admin operations behind a rotatable token.
async function gatewayCall(op: string, params: Record<string, any> = {}) {
  const url = Deno.env.get("EVERPAY_OS_GATEWAY_URL");
  const token = Deno.env.get("PLATFORM_OS_ADMIN_TOKEN");
  if (!url || !token) return { ok: false, error: "gateway_not_configured" } as const;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ op, params, actor: "enki-admin-proxy" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) {
      return { ok: false, error: json?.error || `gateway_${res.status}` } as const;
    }
    return { ok: true, data: json?.data ?? json } as const;
  } catch (err: any) {
    return { ok: false, error: err?.message || "gateway_error" } as const;
  }
}

async function hasWorkingExternalAdmin(extAdmin: any | null) {
  if (!extAdmin) return false;

  const { error } = await extAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    console.error("admin-data-proxy: external admin client unavailable", error.message);
    return false;
  }

  return true;
}

async function getExternalAuthEmailMap(extAdmin: any | null) {
  const emailMap = new Map<string, string | null>();

  if (!extAdmin) return emailMap;

  const { data, error } = await extAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error("admin-data-proxy: external auth lookup unavailable", error.message);
    return emailMap;
  }

  for (const user of data?.users || []) {
    emailMap.set(user.id, user.email ?? null);
  }

  return emailMap;
}

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
  // MzzPay merge — crypto suite
  "crypto_wallets",
  "crypto_assets",
  "crypto_stores",
  "crypto_commissions",
  "crypto_transactions",
  "elektropay_webhook_events",
  // MzzPay merge — surcharging / banking
  "surcharge_settings",
  "bank_accounts_safe",
  "wallets",
  "settlement_runs",
  "payouts",
  "billing_periods",
  // Everpay OS port — treasury 360 / banking / KYC / observability
  "bank_accounts",
  "ledger_entries",
  "liquidity_pools",
  "fx_rates",
  "recipients",
  "api_request_traces",
  "kyc_verifications",
  "plaid_items",
  "everpay_webhooks",
  "rolling_reserves",
  // MzzPay merge — routing analytics, processor matrix, reports
  "provider_events",
  "routing_decisions",
  "payment_attempts",
  "merchant_processor_overrides",
  "business_profiles",
  "payment_processors",
  "settlements",
  "chargeflow_disputes",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extAnonKey = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY");
  const extServiceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  const localUrl = Deno.env.get("SUPABASE_URL");
  const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!extUrl || !extAnonKey || !localUrl || !localServiceKey) {
    return jsonResponse({ error: "External proxy configuration is incomplete" }, 500);
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  if (!token) return jsonResponse({ error: "Auth required" }, 401);

  const extUser = createServerClient(extUrl, extAnonKey, token);
  const extAdmin = extServiceKey ? createServerClient(extUrl, extServiceKey) : null;
  const localAdmin = createServerClient(localUrl, localServiceKey);
  const canUseExtAdmin = await hasWorkingExternalAdmin(extAdmin);
  const externalReadClient = canUseExtAdmin && extAdmin ? extAdmin : extUser;

  const {
    data: authData,
    error: authError,
  } = await extUser.auth.getUser(token);

  if (authError || !authData.user) {
    return jsonResponse({ error: "Invalid token" }, 401);
  }

  const callerId = authData.user.id;
  const callerEmail = authData.user.email ?? null;

  const PLATFORM_ADMIN_EMAILS = [
    "richard.r@everpayinc.com",
    "everpay@gmail.com",
  ];

  const [extRolesRes, localRolesRes] = await Promise.all([
    extUser.from("user_roles").select("role").eq("user_id", callerId),
    localAdmin.from("user_roles").select("role").eq("user_id", callerId),
  ]);

  if (extRolesRes.error) {
    console.error("admin-data-proxy: external role lookup failed", extRolesRes.error.message);
  }

  if (localRolesRes.error) {
    console.error("admin-data-proxy: local role lookup failed", localRolesRes.error.message);
  }

  const allRoles = [...(extRolesRes.data || []), ...(localRolesRes.data || [])];
  const isAdmin = allRoles.some(
    (r: any) => r.role === "super_admin" || r.role === "admin"
  ) || (callerEmail && PLATFORM_ADMIN_EMAILS.includes(callerEmail));

  if (!isAdmin) return jsonResponse({ error: "Forbidden" }, 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const {
    action,
    table,
    filters,
    data,
    id,
    select,
    order,
    limit: rowLimit,
    offset,
    count: wantCount,
  } = body;

  if (!action) return jsonResponse({ error: "action required" }, 400);

  if (action === "list_users") {
    const [profilesRes, rolesRes, emailMap] = await Promise.all([
      externalReadClient.from("profiles").select("*").order("created_at", { ascending: false }),
      externalReadClient.from("user_roles").select("user_id, role"),
      canUseExtAdmin && extAdmin
        ? getExternalAuthEmailMap(extAdmin)
        : Promise.resolve(new Map<string, string | null>()),
    ]);

    if (profilesRes.error) return jsonResponse({ error: profilesRes.error.message }, 500);
    if (rolesRes.error) return jsonResponse({ error: rolesRes.error.message }, 500);

    const roleMap = new Map<string, string[]>();
    (rolesRes.data || []).forEach((r: any) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    const users = (profilesRes.data || []).map((p: any) => ({
      ...p,
      email: p.email || emailMap.get(p.user_id) || null,
      roles: roleMap.get(p.user_id) || ["user"],
      role: (roleMap.get(p.user_id) || ["user"])[0],
    }));

    return jsonResponse({ data: users, degraded: !canUseExtAdmin });
  }

  if (action === "list_merchants_full") {
    const [merchantsRes, profilesRes, emailMap] = await Promise.all([
      externalReadClient.from("merchants").select("*").order("created_at", { ascending: false }),
      externalReadClient.from("merchant_profiles").select("*"),
      canUseExtAdmin && extAdmin
        ? getExternalAuthEmailMap(extAdmin)
        : Promise.resolve(new Map<string, string | null>()),
    ]);

    if (merchantsRes.error) return jsonResponse({ error: merchantsRes.error.message }, 500);
    if (profilesRes.error) return jsonResponse({ error: profilesRes.error.message }, 500);

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

    return jsonResponse({ data: merchants, degraded: !canUseExtAdmin });
  }

  if (action === "update_user_role") {
    const { user_id, new_role } = body;
    if (!user_id || !new_role) return jsonResponse({ error: "user_id and new_role required" }, 400);

    const { error: deleteError } = await extUser.from("user_roles").delete().eq("user_id", user_id);
    if (deleteError) return jsonResponse({ error: deleteError.message }, 500);

    const { error } = await extUser.from("user_roles").insert({ user_id, role: new_role });
    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ ok: true });
  }

  if (action === "toggle_user_status") {
    const { user_id, status } = body;
    if (!user_id) return jsonResponse({ error: "user_id required" }, 400);

    const { error } = await extUser.from("profiles").update({ status }).eq("user_id", user_id);
    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ ok: true });
  }

  if (action === "delete_user") {
    const { user_id } = body;
    if (!user_id) return jsonResponse({ error: "user_id required" }, 400);

    const { error: roleDeleteError } = await extUser.from("user_roles").delete().eq("user_id", user_id);
    if (roleDeleteError) return jsonResponse({ error: roleDeleteError.message }, 500);

    const { error: profileDeleteError } = await extUser.from("profiles").delete().eq("user_id", user_id);
    if (profileDeleteError) return jsonResponse({ error: profileDeleteError.message }, 500);

    if (!canUseExtAdmin || !extAdmin) {
      return jsonResponse({ error: "External auth admin access is unavailable" }, 503);
    }

    const { error } = await extAdmin.auth.admin.deleteUser(user_id);
    if (error) {
      console.error("admin-data-proxy: external auth delete unavailable", error.message);
      return jsonResponse({ error: "External auth admin access is unavailable" }, 503);
    }

    return jsonResponse({ ok: true });
  }

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return jsonResponse({ error: `Invalid or disallowed table: ${table}` }, 400);
  }

  try {
    if (action === "select") {
      const selectOptions: any = {};
      if (wantCount) selectOptions.count = "exact";
      let query = externalReadClient.from(table).select(select || "*", selectOptions);
      if (filters) {
        for (const [col, val] of Object.entries(filters)) {
          if (col === "or" && typeof val === "string") {
            // PostgREST OR filter, e.g. "name.ilike.%foo%,email.ilike.%foo%"
            query = query.or(val);
          } else if (val === null) {
            query = query.is(col, null);
          } else if (Array.isArray(val)) {
            query = query.in(col, val as any[]);
          } else if (typeof val === "object" && val !== null && "ilike" in (val as any)) {
            query = query.ilike(col, (val as any).ilike);
          } else {
            query = query.eq(col, val as any);
          }
        }
      }
      if (order) {
        const cols = Array.isArray(order) ? order : [order];
        for (const o of cols) {
          query = query.order(o.column || "created_at", { ascending: o.ascending ?? false, nullsFirst: false });
        }
      }
      if (typeof offset === "number" && typeof rowLimit === "number") {
        query = query.range(offset, offset + rowLimit - 1);
      } else if (rowLimit) {
        query = query.limit(rowLimit);
      }
      const { data: result, error, count: totalCount } = await query;
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result, count: totalCount ?? null, degraded: !canUseExtAdmin });
    }

    if (action === "insert") {
      if (!data) return jsonResponse({ error: "data required" }, 400);
      const { data: result, error } = await extUser.from(table).insert(data).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "update") {
      if (!id || !data) return jsonResponse({ error: "id and data required" }, 400);
      const { data: result, error } = await extUser.from(table).update(data).eq("id", id).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "upsert") {
      if (!data) return jsonResponse({ error: "data required" }, 400);
      const onConflict = body.on_conflict || "id";
      const { data: result, error } = await extUser.from(table).upsert(data, { onConflict }).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: result });
    }

    if (action === "delete") {
      if (!id) return jsonResponse({ error: "id required" }, 400);
      const { error } = await extUser.from(table).delete().eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
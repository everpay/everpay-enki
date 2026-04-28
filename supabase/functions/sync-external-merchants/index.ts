import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * sync-external-merchants
 *
 * Pulls all merchants + signups (auth users + profiles) from the external
 * production project and returns a normalized snapshot for Enki admin views.
 * Optional `since` query parameter (ISO timestamp) returns only records
 * created after that point — used to surface new signups in real time.
 *
 * Auth: caller must be platform admin in either the external or local project.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extAnonKey = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY");
  const extServiceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  const localUrl = Deno.env.get("SUPABASE_URL");
  const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!extUrl || !extAnonKey || !extServiceKey || !localUrl || !localServiceKey) {
    return jsonResponse({ error: "Sync configuration is incomplete" }, 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return jsonResponse({ error: "Auth required" }, 401);

  // Validate the caller via the external auth (which is the canonical source)
  const extUser = createClient(extUrl, extAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: who, error: whoErr } = await extUser.auth.getUser(token);
  if (whoErr || !who.user) return jsonResponse({ error: "Invalid token" }, 401);

  const callerId = who.user.id;
  const callerEmail = who.user.email ?? null;

  const PLATFORM_ADMIN_EMAILS = ["richard.r@everpayinc.com", "everpay@gmail.com"];
  const localAdmin = createClient(localUrl, localServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [extRoles, localRoles] = await Promise.all([
    extUser.from("user_roles").select("role").eq("user_id", callerId),
    localAdmin.from("user_roles").select("role").eq("user_id", callerId),
  ]);
  const allRoles = [...(extRoles.data || []), ...(localRoles.data || [])];
  const isAdmin =
    allRoles.some((r: any) => r.role === "admin" || r.role === "super_admin") ||
    (callerEmail && PLATFORM_ADMIN_EMAILS.includes(callerEmail));
  if (!isAdmin) return jsonResponse({ error: "Forbidden" }, 403);

  // Use external service role for the actual snapshot (bypass RLS)
  const extAdmin = createClient(extUrl, extServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body OK */ }
  const since: string | undefined = body?.since;

  // 1) Auth users (paginated)
  const authUsers: Array<{ id: string; email: string | null; created_at: string }> = [];
  let page = 1;
  // Cap at 50 pages = 50,000 users to keep this cheap
  while (page <= 50) {
    const { data: pg, error } = await extAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return jsonResponse({ error: `external auth list failed: ${error.message}` }, 500);
    const users = pg?.users || [];
    for (const u of users) {
      if (!since || u.created_at > since) {
        authUsers.push({ id: u.id, email: u.email ?? null, created_at: u.created_at });
      }
    }
    if (users.length < 1000) break;
    page++;
  }

  // 2) Merchants + profiles
  const merchantsQ = extAdmin.from("merchants").select("*").order("created_at", { ascending: false });
  const profilesQ = extAdmin.from("merchant_profiles").select("*");
  if (since) merchantsQ.gt("created_at", since);
  const [merchantsRes, profilesRes] = await Promise.all([merchantsQ, profilesQ]);
  if (merchantsRes.error) return jsonResponse({ error: merchantsRes.error.message }, 500);
  if (profilesRes.error) return jsonResponse({ error: profilesRes.error.message }, 500);

  const profileByMid = new Map((profilesRes.data || []).map((p: any) => [p.merchant_id, p]));
  const emailById = new Map(authUsers.map((u) => [u.id, u.email]));

  const merchants = (merchantsRes.data || []).map((m: any) => ({
    ...m,
    email: m.email || emailById.get(m.user_id) || null,
    profile: profileByMid.get(m.id) || null,
    onboarding_status: profileByMid.get(m.id)?.onboarding_status || "pending",
  }));

  return jsonResponse({
    synced_at: new Date().toISOString(),
    since: since || null,
    counts: { users: authUsers.length, merchants: merchants.length },
    users: authUsers,
    merchants,
  });
});
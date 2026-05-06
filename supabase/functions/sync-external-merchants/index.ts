import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const GATEWAY = Deno.env.get("EVERPAY_OS_GATEWAY_URL")!;
const TOKEN = Deno.env.get("PLATFORM_OS_ADMIN_TOKEN")!;

async function gw(op: string, params: Record<string, unknown> = {}) {
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ op, params, actor: "admin-os" }),
  });
  return await r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const localUrl = Deno.env.get("SUPABASE_URL")!;
  const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const localAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return json({ error: "Auth required" }, 401);

  // Validate caller against local DB (Admin OS auth)
  const userClient = createClient(localUrl, localAnon, { global: { headers: { Authorization: auth } } });
  const { data: who } = await userClient.auth.getUser(token);
  if (!who?.user) return json({ error: "Invalid token" }, 401);

  const localAdmin = createClient(localUrl, localServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: roles } = await localAdmin.from("user_roles").select("role").eq("user_id", who.user.id);
  const isAdmin = (roles || []).some((r: any) => r.role === "admin" || r.role === "super_admin")
    || ["richard.r@everpayinc.com", "everpay@gmail.com"].includes(who.user.email || "");
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  // Pull snapshot via the gateway (no service role exposure)
  const since = (await req.json().catch(() => ({})))?.since;
  const snap = await gw("sync.snapshot", { since });
  return json(snap);
});

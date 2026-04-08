import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Auth: service role key via header or body, or super_admin user
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";

  // Parse body early to check for provision_key
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  const hasServiceRole = token === serviceRoleKey || body.provision_key === serviceRoleKey;

  if (!hasServiceRole) {
    if (token) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some((r: any) => r.role === "super_admin")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  const { merchant_id, routes, rules } = body;
  if (!merchant_id) {
    return new Response(JSON.stringify({ error: "merchant_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results: any[] = [];

  for (const route of (routes || [])) {
    const { data, error } = await admin.from("psp_routes").insert({
      merchant_id,
      processor: route.processor,
      priority: route.priority ?? 0,
      active: route.active ?? true,
      country: route.country || null,
    }).select();
    results.push({ type: "psp_route", processor: route.processor, data, error: error?.message });
  }

  for (const rule of (rules || [])) {
    const { data, error } = await admin.from("routing_rules").insert({
      merchant_id,
      name: rule.name,
      priority: rule.priority ?? 0,
      target_provider: rule.target_provider,
      fallback_provider: rule.fallback_provider || null,
      active: rule.active ?? true,
      currency_match: rule.currency_match || [],
    }).select();
    results.push({ type: "routing_rule", name: rule.name, data, error: error?.message });
  }

  return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

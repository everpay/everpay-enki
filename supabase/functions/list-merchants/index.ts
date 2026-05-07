import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { gw } from "../_shared/everpay-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const localUrl = Deno.env.get("SUPABASE_URL")!;
  const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const localAdmin = createClient(localUrl, localServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL") || localUrl;
  const extAnon = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
  const extAuth = createClient(extUrl, extAnon, { auth: { autoRefreshToken: false, persistSession: false } });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return jr({ error: "Auth required" }, 401);

  // Token issued by EXTERNAL auth project — verify there.
  const { data: userData, error: userErr } = await extAuth.auth.getUser(token);
  if (userErr || !userData?.user?.id) return jr({ error: "Invalid token" }, 401);
  const callerId: string = userData.user.id;
  const callerEmail: string | null = userData.user.email ?? null;

  let isAdmin = false;
  {
    const lr = await localAdmin.from("user_roles").select("role").eq("user_id", callerId);
    isAdmin = (lr.data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
  }
  if (!isAdmin) {
    try {
      const ext = await gw<{ data: any[] }>("db.select", {
        table: "user_roles", select: "role", filters: { user_id: callerId },
      });
      isAdmin = (ext.data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    } catch (e) { console.error("ext role check failed", (e as Error).message); }
  }
  if (!isAdmin) return jr({ error: "Forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body OK */ }

  const snapshot = await gw<{
    synced_at: string; since: string | null;
    counts: { users: number; merchants: number };
    users: any[]; merchants: any[];
  }>("sync.snapshot", { since: body?.since }, callerEmail || "platform-os");

  return jr(snapshot);
});
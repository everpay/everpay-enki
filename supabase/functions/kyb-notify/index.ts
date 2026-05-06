// kyb-notify: receives "new KYB document" events from the merchant project
// (via the platform-admin-gateway) and writes a row into kyb_review_notifications.
// Realtime push to admin clients happens through Postgres replication.
//
// Auth: shared bearer token (PLATFORM_OS_ADMIN_TOKEN). No user JWT required —
// this is server-to-server. JWT verification is disabled in config.toml.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jr = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jr({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("PLATFORM_OS_ADMIN_TOKEN") || "";
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected || auth !== expected) return jr({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return jr({ error: "invalid_json" }, 400); }

  // Accept single event or batch
  const events: any[] = Array.isArray(body?.events) ? body.events : [body];
  const valid = events
    .filter((e) => e && typeof e.doc_id === "string")
    .map((e) => ({
      doc_id: e.doc_id,
      merchant_id: e.merchant_id ?? null,
      user_id: e.user_id ?? null,
      doc_type: e.doc_type ?? null,
      file_name: e.file_name ?? null,
      status: e.status ?? "pending",
      metadata: e.metadata ?? {},
    }));
  if (!valid.length) return jr({ error: "no_valid_events" }, 400);

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supa
    .from("kyb_review_notifications")
    .upsert(valid, { onConflict: "doc_id", ignoreDuplicates: false })
    .select("id, doc_id");

  if (error) {
    console.error("kyb-notify insert failed", error.message);
    return jr({ error: "insert_failed" }, 500);
  }
  return jr({ ok: true, count: data?.length ?? 0 });
});
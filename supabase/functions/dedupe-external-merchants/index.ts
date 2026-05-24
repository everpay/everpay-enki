import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Admin-only one-shot utility that removes duplicate merchant rows in the
 * external Everpay project. Duplicates are detected by normalized `name`.
 * The OLDEST row (by created_at) is kept, the rest are deleted.
 *
 * Body: { dry_run?: boolean }   default true
 * Header: Authorization: Bearer <admin user JWT>
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const auth = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!auth?.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);

    const local = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = auth.slice(7).trim();

    // Allow direct service-role invocation (e.g., from this tool / a maintenance job).
    let isAdmin = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!isAdmin) {
      const { data: claims, error: cErr } = await local.auth.getClaims(token);
      if (cErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
      const userId = claims.claims.sub as string;
      const { data: roles } = await local.from("user_roles").select("role").eq("user_id", userId);
      isAdmin = (roles || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body.dry_run !== false;

    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!extUrl || !extKey) return json({ error: "external_credentials_missing" }, 500);
    const ext = createClient(extUrl, extKey);

    const { data: merchants, error: mErr } = await ext
      .from("merchants")
      .select("id, name, user_id, created_at")
      .order("created_at", { ascending: true });
    if (mErr) return json({ error: mErr.message }, 500);

    const groups = new Map<string, any[]>();
    for (const m of merchants || []) {
      const key = (m.name || "").trim().toLowerCase();
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }

    const duplicates: any[] = [];
    const deleted: string[] = [];
    for (const [key, rows] of groups) {
      if (rows.length < 2) continue;
      const [keep, ...rest] = rows;
      duplicates.push({ name: key, kept: keep.id, removed: rest.map((r) => r.id) });
      if (!dryRun) {
        const ids = rest.map((r) => r.id);
        const { error: dErr } = await ext.from("merchants").delete().in("id", ids);
        if (dErr) return json({ error: dErr.message, partial_deleted: deleted, duplicates }, 500);
        deleted.push(...ids);
      }
    }

    return json({ ok: true, dry_run: dryRun, groups: duplicates.length, deleted_count: deleted.length, duplicates });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal_error" }, 500);
  }
});
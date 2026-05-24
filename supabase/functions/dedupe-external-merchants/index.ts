import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyJwt, corsHeaders } from "../_shared/auth.ts";

/**
 * Admin-only one-shot utility that removes duplicate merchant rows in the
 * external Everpay project AND the local Enki project.
 *
 * Strategy (per project):
 *   1. Collapse rows that share the same `user_id` (keep oldest by created_at).
 *   2. Collapse rows that share a normalized `name` (keep oldest).
 *   3. Cascade-update references on `psp_routes.merchant_id`,
 *      `routing_rules.merchant_id`, `rate_limits.merchant_id`,
 *      `merchant_pricing.merchant_id` to point at the kept merchant before
 *      deletion (skipped silently if a table doesn't exist).
 *
 * Body: { dry_run?: boolean }   default true
 * Header: Authorization: Bearer <admin user JWT | service_role>
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const v = await verifyJwt(req, {
      requireRoles: ["admin", "super_admin"],
      allowExternalRoles: true,
      allowServiceRole: true,
    });
    if (!v.ok) return v.response;
    const local = v.localAdmin;

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body.dry_run !== false;

    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    const ext = extUrl && extKey ? createClient(extUrl, extKey) : null;

    const REF_TABLES = [
      "psp_routes",
      "routing_rules",
      "rate_limits",
      "merchant_pricing",
      "merchant_processor_overrides",
    ];

    async function dedupeOne(client: ReturnType<typeof createClient>, label: string) {
      const out: any = { label, removed: 0, groups: [] as any[], errors: [] as string[] };
      const { data: merchants, error: mErr } = await client
        .from("merchants")
        .select("id, name, user_id, created_at")
        .order("created_at", { ascending: true });
      if (mErr) { out.errors.push(`select_merchants: ${mErr.message}`); return out; }
      if (!merchants?.length) return out;

      // Build dedupe groups: first by user_id, then by normalized name (for rows
      // without user_id or where the same business was registered under two users).
      const seen = new Set<string>(); // ids already assigned to a group
      const groups: { keep: any; remove: any[]; reason: string }[] = [];

      const byUser = new Map<string, any[]>();
      for (const m of merchants) {
        if (!m.user_id) continue;
        if (!byUser.has(m.user_id)) byUser.set(m.user_id, []);
        byUser.get(m.user_id)!.push(m);
      }
      for (const [uid, rows] of byUser) {
        if (rows.length < 2) continue;
        const [keep, ...rest] = rows;
        rest.forEach((r) => seen.add(r.id));
        seen.add(keep.id);
        groups.push({ keep, remove: rest, reason: `user_id:${uid}` });
      }

      const byName = new Map<string, any[]>();
      for (const m of merchants) {
        if (seen.has(m.id)) continue;
        const key = (m.name || "").trim().toLowerCase();
        if (!key) continue;
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key)!.push(m);
      }
      for (const [name, rows] of byName) {
        if (rows.length < 2) continue;
        const [keep, ...rest] = rows;
        groups.push({ keep, remove: rest, reason: `name:${name}` });
      }

      for (const g of groups) {
        const removeIds = g.remove.map((r) => r.id);
        out.groups.push({ keep: g.keep.id, removed: removeIds, reason: g.reason });
        if (dryRun) continue;

        // Re-point references on each known reference table (ignore missing tables).
        for (const t of REF_TABLES) {
          const { error: uErr } = await client
            .from(t)
            .update({ merchant_id: g.keep.id })
            .in("merchant_id", removeIds);
          if (uErr && !/relation .* does not exist/i.test(uErr.message)) {
            out.errors.push(`${t}.update: ${uErr.message}`);
          }
        }

        const { error: dErr } = await client.from("merchants").delete().in("id", removeIds);
        if (dErr) { out.errors.push(`delete: ${dErr.message}`); continue; }
        out.removed += removeIds.length;
      }
      return out;
    }

    const results: any[] = [];
    results.push(await dedupeOne(local as any, "local"));
    if (ext) results.push(await dedupeOne(ext as any, "external"));

    return json({
      ok: true,
      dry_run: dryRun,
      results,
      total_removed: results.reduce((a, r) => a + r.removed, 0),
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal_error" }, 500);
  }
});
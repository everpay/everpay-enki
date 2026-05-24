import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
};

/**
 * Routing config writer: save / activate / rollback failover configs +
 * routing rule activation events, with audit log + idempotency.
 *
 * POST body:
 *  { action: "save"|"activate"|"deactivate"|"rollback"|"log_decision",
 *    config?: { processor, max_retries, retry_delay_ms, backoff, fallback_chain, active, merchant_id? },
 *    config_id?: string,
 *    target_version?: number,           // rollback target
 *    decision?: { rule_id?, chosen_chain: string[], inputs: any, outcome: string }
 *  }
 *
 * Header: idempotency-key (recommended for save/activate/rollback)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: require admin/super_admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "unauthorized" }, 401);
    }
    const userId = userData.user.id;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json();
    const action: string = body.action;
    const idemKey = req.headers.get("idempotency-key");

    // Idempotency: short-circuit replay
    if (idemKey) {
      const { data: existing } = await supabase
        .from("routing_idempotency").select("response").eq("key", idemKey).maybeSingle();
      if (existing?.response) {
        return json({ ...existing.response, replayed: true });
      }
    }

    let result: any = {};

    if (action === "save") {
      const cfg = body.config ?? {};
      const { data: prev } = await supabase
        .from("failover_configs").select("*")
        .eq("processor", cfg.processor)
        .is("merchant_id", cfg.merchant_id ?? null)
        .maybeSingle();

      const payload = {
        merchant_id: cfg.merchant_id ?? null,
        processor: cfg.processor,
        max_retries: cfg.max_retries ?? 3,
        retry_delay_ms: cfg.retry_delay_ms ?? 1000,
        backoff: cfg.backoff ?? "exponential",
        fallback_chain: cfg.fallback_chain ?? [],
        active: cfg.active ?? true,
        version: (prev?.version ?? 0) + 1,
        updated_by: userId,
      };

      const { data: upserted, error: upErr } = await supabase
        .from("failover_configs")
        .upsert(payload, { onConflict: "merchant_id,processor" })
        .select().single();
      if (upErr) {
        // Fallback path if unique constraint is on COALESCE(merchant_id,...)
        if (prev) {
          const { data: u2, error: e2 } = await supabase
            .from("failover_configs").update(payload).eq("id", prev.id).select().single();
          if (e2) return json({ error: e2.message }, 400);
          result.config = u2;
        } else {
          const { data: i2, error: e3 } = await supabase
            .from("failover_configs").insert(payload).select().single();
          if (e3) return json({ error: e3.message }, 400);
          result.config = i2;
        }
      } else {
        result.config = upserted;
      }

      await supabase.from("routing_audit_log").insert({
        actor_id: userId, action: "save", entity_type: "failover_config",
        entity_id: result.config.id, merchant_id: cfg.merchant_id ?? null,
        before: prev ?? null, after: result.config,
      });
    } else if (action === "activate" || action === "deactivate") {
      const id = body.config_id;
      const { data: prev } = await supabase.from("failover_configs").select("*").eq("id", id).maybeSingle();
      if (!prev) return json({ error: "not_found" }, 404);
      const { data: updated, error } = await supabase
        .from("failover_configs")
        .update({ active: action === "activate", updated_by: userId, version: prev.version + 1 })
        .eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      result.config = updated;
      await supabase.from("routing_audit_log").insert({
        actor_id: userId, action, entity_type: "failover_config",
        entity_id: id, merchant_id: prev.merchant_id, before: prev, after: updated,
      });
    } else if (action === "rollback") {
      const id = body.config_id;
      const { data: current } = await supabase.from("failover_configs").select("*").eq("id", id).maybeSingle();
      if (!current) return json({ error: "not_found" }, 404);
      // Find the most recent prior audit "after" snapshot for this config
      const { data: history } = await supabase.from("routing_audit_log")
        .select("*")
        .eq("entity_type", "failover_config").eq("entity_id", id)
        .order("created_at", { ascending: false }).limit(10);
      const target = (history ?? []).find((h: any) =>
        h.before && (!body.target_version || h.before.version === body.target_version));
      if (!target?.before) return json({ error: "no_rollback_target" }, 400);
      const restored = {
        max_retries: target.before.max_retries,
        retry_delay_ms: target.before.retry_delay_ms,
        backoff: target.before.backoff,
        fallback_chain: target.before.fallback_chain,
        active: target.before.active,
        updated_by: userId,
        version: current.version + 1,
      };
      const { data: updated, error } = await supabase
        .from("failover_configs").update(restored).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      result.config = updated;
      await supabase.from("routing_audit_log").insert({
        actor_id: userId, action: "rollback", entity_type: "failover_config",
        entity_id: id, merchant_id: current.merchant_id,
        before: current, after: updated,
        metadata: { rolled_back_to_version: target.before.version },
      });
    } else if (action === "log_decision") {
      const d = body.decision ?? {};
      const { data: row, error } = await supabase.from("routing_audit_log").insert({
        actor_id: userId, action: "evaluation", entity_type: "routing_decision",
        entity_id: d.rule_id ?? null, merchant_id: d.merchant_id ?? null,
        after: { chosen_chain: d.chosen_chain, outcome: d.outcome }, metadata: { inputs: d.inputs ?? {} },
      }).select().single();
      if (error) return json({ error: error.message }, 400);
      result.entry = row;
    } else {
      return json({ error: "unknown_action" }, 400);
    }

    // Persist idempotency response
    if (idemKey) {
      await supabase.from("routing_idempotency").upsert({
        key: idemKey, operation: action, response: result,
      });
    }

    return json(result);
  } catch (err: any) {
    console.error("routing-config-write error", err);
    return json({ error: err?.message ?? "internal_error" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { gw } from "../_shared/everpay-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_TABLES = new Set([
  "profiles","user_roles","merchants","merchant_profiles","merchant_pricing","psp_routes",
  "routing_rules","accounts","transactions","customers","disputes","payment_methods",
  "subscriptions","subscription_plans","invoices","refunds","audit_logs","fee_breakdowns",
  "processors","processor_strategy","processor_fee_profiles","platform_fee_markups",
  "routing_attempt_logs","reseller_splits","elektropay_payments","elektropay_settings",
  "elektropay_wallets","orders","payment_intents","settlement_batches","crypto_wallets",
  "crypto_assets","crypto_stores","crypto_commissions","crypto_transactions",
  "elektropay_webhook_events","surcharge_settings","bank_accounts_safe","wallets",
  "settlement_runs","payouts","billing_periods","bank_accounts","ledger_entries",
  "liquidity_pools","fx_rates","recipients","api_request_traces","kyc_verifications",
  "plaid_items","everpay_webhooks","rolling_reserves","provider_events","routing_decisions",
  "payment_attempts","merchant_processor_overrides","business_profiles","payment_processors",
  "settlements","chargeflow_disputes","kyb_documents",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const localUrl = Deno.env.get("SUPABASE_URL")!;
  const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const localAdmin = createClient(localUrl, localServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return jr({ error: "Auth required" }, 401);

  let callerId: string | null = null;
  let callerEmail: string | null = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    callerId = payload.sub ?? null;
    callerEmail = payload.email ?? null;
  } catch { return jr({ error: "Invalid token" }, 401); }
  if (!callerId) return jr({ error: "Invalid token" }, 401);

  const PLATFORM_ADMIN_EMAILS = ["richard.r@everpayinc.com", "everpay@gmail.com"];
  let isAdmin = (callerEmail && PLATFORM_ADMIN_EMAILS.includes(callerEmail)) || false;

  if (!isAdmin) {
    const localRoles = await localAdmin.from("user_roles").select("role").eq("user_id", callerId);
    isAdmin = (localRoles.data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
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

  let body: any;
  try { body = await req.json(); } catch { return jr({ error: "Invalid JSON" }, 400); }

  const { action, table, filters, data, id, select, order, limit, offset, count } = body;
  if (!action) return jr({ error: "action required" }, 400);

  try {
    if (action === "list_users") {
      const r = await gw<{ data: any[] }>("users.list");
      return jr({ data: r.data, degraded: false });
    }
    if (action === "list_merchants_full") {
      const r = await gw<{ data: any[] }>("merchants.list_full");
      return jr({ data: r.data, degraded: false });
    }
    if (action === "update_merchant") {
      // body: { merchant_id, patch: { name?, email?, phone?, status? } }
      if (!body.merchant_id || !body.patch) return jr({ error: "merchant_id + patch required" }, 400);
      const patch = body.patch || {};
      const fieldErrors: Record<string, string> = {};
      const ALLOWED_STATUSES = ["active", "pending", "suspended"];
      if (patch.email != null && patch.email !== "") {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(patch.email));
        if (!emailOk) fieldErrors.email = "Invalid email format";
      }
      if (patch.status && !ALLOWED_STATUSES.includes(patch.status)) {
        fieldErrors.status = `Status must be one of ${ALLOWED_STATUSES.join(", ")}`;
      }
      if (patch.name != null && String(patch.name).trim().length < 2) {
        fieldErrors.name = "Name must be at least 2 characters";
      }
      // Email uniqueness check (best-effort, local first)
      if (!fieldErrors.email && patch.email) {
        const { data: dup } = await localAdmin
          .from("merchants")
          .select("id")
          .eq("email", patch.email)
          .neq("id", body.merchant_id)
          .maybeSingle();
        if (dup) fieldErrors.email = "Email already in use by another merchant";
      }
      if (Object.keys(fieldErrors).length) {
        return jr({ error: "Validation failed", field_errors: fieldErrors }, 422);
      }
      // Snapshot existing for audit
      let before: any = null;
      try {
        const ext = await gw<{ data: any[] }>("db.select", { table: "merchants", filters: { id: body.merchant_id } });
        before = (ext.data || [])[0] || null;
      } catch {}
      if (!before) {
        const { data } = await localAdmin.from("merchants").select("*").eq("id", body.merchant_id).maybeSingle();
        before = data || null;
      }
      // Allowed status transitions (no transition from suspended -> active without explicit reactivation flag)
      if (patch.status && before?.status === "suspended" && patch.status === "active" && !body.reactivate) {
        return jr({ error: "Suspended merchants must be explicitly reactivated", field_errors: { status: "Pass reactivate:true to reactivate" } }, 409);
      }
      let updated: any = null;
      let fallback = false;
      try {
        const r = await gw<{ ok: boolean; merchant?: any }>(
          "merchants.update",
          { merchant_id: body.merchant_id, patch },
          callerEmail || "platform-os",
        );
        updated = r.merchant;
      } catch (e) {
        const { data, error } = await localAdmin.from("merchants").update(patch).eq("id", body.merchant_id).select().maybeSingle();
        if (error) return jr({ error: error.message, gateway_error: (e as Error).message }, 502);
        updated = data; fallback = true;
      }
      // Compute diff
      const diff: Record<string, { old: any; new: any }> = {};
      for (const k of Object.keys(patch)) {
        if (before?.[k] !== patch[k]) diff[k] = { old: before?.[k] ?? null, new: patch[k] };
      }
      // Audit log (gateway, fall back to local)
      const auditRow = {
        user_id: callerId,
        action: "merchant.update",
        entity_type: "merchant",
        entity_id: body.merchant_id,
        metadata: { reviewer_email: callerEmail, diff, fallback, at: new Date().toISOString() },
      };
      try { await gw("db.insert", { table: "audit_logs", data: auditRow }, callerEmail || "platform-os"); }
      catch { await localAdmin.from("audit_logs").insert(auditRow); }
      return jr({ ok: true, merchant: updated, diff, fallback });
    }
    if (action === "merchant_audit_log") {
      if (!body.merchant_id) return jr({ error: "merchant_id required" }, 400);
      let rows: any[] = [];
      try {
        const r = await gw<{ data: any[] }>("db.select", {
          table: "audit_logs",
          filters: { entity_type: "merchant", entity_id: body.merchant_id },
          order: { column: "created_at", ascending: false },
          limit: 100,
        });
        rows = r.data || [];
      } catch {
        const { data } = await localAdmin.from("audit_logs").select("*")
          .eq("entity_type", "merchant").eq("entity_id", body.merchant_id)
          .order("created_at", { ascending: false }).limit(100);
        rows = data || [];
      }
      return jr({ data: rows });
    }
    if (action === "search_user_reconciliation") {
      // body: { q } – search auth.users + merchants + merchant_profiles by email/name across local + gateway
      const q = String(body.q || "").trim();
      if (q.length < 2) return jr({ error: "q must be at least 2 chars" }, 400);
      const results: any[] = [];
      // Local
      try {
        const { data: locUsers } = await localAdmin
          .from("merchants")
          .select("id,name,user_id,email,phone,created_at")
          .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(50);
        (locUsers || []).forEach((m: any) => results.push({ ...m, source: "local" }));
      } catch {}
      // Gateway
      try {
        const r = await gw<{ data: any[] }>("merchants.search", { q });
        (r.data || []).forEach((m: any) => results.push({ ...m, source: "platform" }));
      } catch {
        try {
          const r2 = await gw<{ data: any[] }>("db.select", {
            table: "merchants",
            filters: {},
            ilike: { name: `%${q}%` },
            limit: 50,
          });
          (r2.data || []).forEach((m: any) => results.push({ ...m, source: "platform" }));
        } catch {}
      }
      // Auth users (local)
      try {
        const { data: au } = await localAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const matched = (au?.users || []).filter((u: any) =>
          (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
          ((u.user_metadata?.display_name || "") + "").toLowerCase().includes(q.toLowerCase())
        );
        matched.forEach((u: any) => results.push({
          source: "auth_user", user_id: u.id, email: u.email,
          name: u.user_metadata?.display_name, created_at: u.created_at,
        }));
      } catch {}
      return jr({ data: results });
    }
    if (action === "link_merchant_user") {
      // body: { merchant_id, user_id }
      if (!body.merchant_id || !body.user_id) return jr({ error: "merchant_id + user_id required" }, 400);
      try {
        await gw("merchants.update", { merchant_id: body.merchant_id, patch: { user_id: body.user_id } }, callerEmail || "platform-os");
      } catch {
        await localAdmin.from("merchants").update({ user_id: body.user_id }).eq("id", body.merchant_id);
      }
      const auditRow = {
        user_id: callerId, action: "merchant.link_user",
        entity_type: "merchant", entity_id: body.merchant_id,
        metadata: { linked_user_id: body.user_id, by: callerEmail, at: new Date().toISOString() },
      };
      try { await gw("db.insert", { table: "audit_logs", data: auditRow }, callerEmail || "platform-os"); }
      catch { await localAdmin.from("audit_logs").insert(auditRow); }
      return jr({ ok: true });
    }
    if (action === "resend_invite") {
      // body: { email, merchant_id? }
      if (!body.email) return jr({ error: "email required" }, 400);
      const redirectTo = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || ""}/onboarding`;
      let result: any = null; let usedAdminInvite = false;
      try {
        const { data, error } = await localAdmin.auth.admin.inviteUserByEmail(body.email, { redirectTo });
        if (error) throw error;
        result = data; usedAdminInvite = true;
      } catch (e) {
        // Fall back to a magic-link style trigger via gateway
        try { await gw("users.invite", { email: body.email, merchant_id: body.merchant_id }, callerEmail || "platform-os"); }
        catch (e2) { return jr({ error: (e as Error).message, gateway_error: (e2 as Error).message }, 502); }
      }
      const auditRow = {
        user_id: callerId, action: "merchant.invite_resent",
        entity_type: "merchant", entity_id: body.merchant_id || body.email,
        metadata: { email: body.email, by: callerEmail, used_admin_invite: usedAdminInvite, at: new Date().toISOString() },
      };
      try { await gw("db.insert", { table: "audit_logs", data: auditRow }, callerEmail || "platform-os"); }
      catch { await localAdmin.from("audit_logs").insert(auditRow); }
      return jr({ ok: true, invited: !!result });
    }
    if (action === "sync_merchant_records") {
      // body: { merchant_id }
      if (!body.merchant_id) return jr({ error: "merchant_id required" }, 400);
      const summary: Record<string, number> = { transactions: 0, provider_events: 0 };
      // Transactions
      try {
        const txr = await gw<{ data: any[] }>("db.select", {
          table: "transactions", filters: { merchant_id: body.merchant_id }, limit: 1000,
        });
        const rows = txr.data || [];
        if (rows.length) {
          const { error } = await localAdmin.from("transactions").upsert(rows, { onConflict: "id" });
          if (!error) summary.transactions = rows.length;
        }
      } catch (e) { console.error("tx sync failed", (e as Error).message); }
      // Provider events
      try {
        const per = await gw<{ data: any[] }>("db.select", {
          table: "provider_events", filters: { merchant_id: body.merchant_id }, limit: 1000,
        });
        const rows = per.data || [];
        if (rows.length) {
          const { error } = await localAdmin.from("provider_events").upsert(rows, { onConflict: "id" });
          if (!error) summary.provider_events = rows.length;
        }
      } catch (e) { console.error("provider_events sync failed", (e as Error).message); }
      const auditRow = {
        user_id: callerId, action: "merchant.sync_records",
        entity_type: "merchant", entity_id: body.merchant_id,
        metadata: { ...summary, by: callerEmail, at: new Date().toISOString() },
      };
      try { await gw("db.insert", { table: "audit_logs", data: auditRow }, callerEmail || "platform-os"); }
      catch { await localAdmin.from("audit_logs").insert(auditRow); }
      return jr({ ok: true, summary });
    }
    if (action === "update_user_role") {
      await gw("users.update_role", { user_id: body.user_id, new_role: body.new_role }, callerEmail || "platform-os");
      return jr({ ok: true });
    }
    if (action === "toggle_user_status") {
      await gw("users.toggle_status", { user_id: body.user_id, status: body.status }, callerEmail || "platform-os");
      return jr({ ok: true });
    }
    if (action === "delete_user") {
      await gw("users.delete", { user_id: body.user_id }, callerEmail || "platform-os");
      return jr({ ok: true });
    }

    // ---- KYB-specific helpers --------------------------------------------
    if (action === "kyb_signed_url") {
      // body: { file_path, expires_in?: number }
      if (!body.file_path) return jr({ error: "file_path required" }, 400);
      const expires = Math.min(Math.max(Number(body.expires_in) || 300, 30), 3600);
      const r = await gw<{ signed_url: string; expires_in: number }>(
        "kyb.signed_url",
        { file_path: body.file_path, expires_in: expires },
        callerEmail || "platform-os",
      );
      return jr({ signed_url: r.signed_url, expires_in: r.expires_in });
    }

    if (action === "kyb_decide") {
      // body: { decisions: [{ id, status: 'approved'|'rejected', notes }] }
      const decisions: any[] = Array.isArray(body.decisions) ? body.decisions : [];
      if (!decisions.length) return jr({ error: "decisions required" }, 400);
      const reviewer = callerEmail || callerId || "platform-os";
      const reviewedAt = new Date().toISOString();
      const results: any[] = [];
      for (const d of decisions) {
        if (!d?.id || !["approved", "rejected"].includes(d.status)) {
          results.push({ id: d?.id, ok: false, error: "invalid_decision" });
          continue;
        }
        try {
          await gw("db.update", {
            table: "kyb_documents",
            id: d.id,
            data: {
              status: d.status,
              review_notes: d.notes || null,
              reviewed_at: reviewedAt,
              reviewed_by: callerId,
            },
          }, reviewer);

          // Audit log written into the merchant project (source of truth).
          await gw("db.insert", {
            table: "audit_logs",
            data: {
              user_id: callerId,
              action: `kyb.${d.status}`,
              entity_type: "kyb_document",
              entity_id: d.id,
              metadata: {
                reviewer_email: callerEmail,
                reviewer_id: callerId,
                reviewed_at: reviewedAt,
                notes: d.notes || null,
              },
            },
          }, reviewer).catch((e) => console.error("audit insert failed", (e as Error).message));

          // Mark local notification as read (best-effort).
          await localAdmin
            .from("kyb_review_notifications")
            .update({ status: d.status, read_at: reviewedAt })
            .eq("doc_id", d.id);

          results.push({ id: d.id, ok: true });
        } catch (e: any) {
          results.push({ id: d.id, ok: false, error: e?.message || "update_failed" });
        }
      }
      return jr({ results });
    }
    // ----------------------------------------------------------------------

    if (!table || !ALLOWED_TABLES.has(table)) return jr({ error: `Invalid or disallowed table: ${table}` }, 400);

    if (action === "select") {
      const r = await gw<{ data: any[]; count: number | null }>("db.select", {
        table, select, filters, order, limit, offset, count,
      });
      return jr({ data: r.data, count: r.count, degraded: false });
    }
    if (action === "insert") {
      if (!data) return jr({ error: "data required" }, 400);
      const r = await gw<{ data: any[] }>("db.insert", { table, data }, callerEmail || "platform-os");
      return jr({ data: r.data });
    }
    if (action === "update") {
      if (!id || !data) return jr({ error: "id and data required" }, 400);
      const r = await gw<{ data: any[] }>("db.update", { table, id, data }, callerEmail || "platform-os");
      return jr({ data: r.data });
    }
    if (action === "upsert") {
      if (!data) return jr({ error: "data required" }, 400);
      const r = await gw<{ data: any[] }>("db.upsert", { table, data, on_conflict: body.on_conflict }, callerEmail || "platform-os");
      return jr({ data: r.data });
    }
    if (action === "delete") {
      if (!id) return jr({ error: "id required" }, 400);
      await gw("db.delete", { table, id }, callerEmail || "platform-os");
      return jr({ ok: true });
    }

    return jr({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    return jr({ error: err.message || "Internal error" }, 500);
  }
});
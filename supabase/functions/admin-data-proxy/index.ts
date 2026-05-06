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
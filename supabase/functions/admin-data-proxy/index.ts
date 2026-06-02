import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { gw } from "../_shared/everpay-gateway.ts";
import { verifyJwt, corsHeaders } from "../_shared/auth.ts";

const jr = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_TABLES = new Set([
  "profiles","user_roles","merchants","merchant_profiles","merchant_pricing","psp_routes",
  "routing_rules","accounts","transactions","customers","disputes","payment_methods",
  "subscriptions","subscription_plans","invoices","refunds","audit_logs","fee_breakdowns",
  "processors","processor_strategy","processor_fee_profiles","platform_fee_markups",
  "routing_attempt_logs","reseller_splits","elektropay_payments","elektropay_settings",
  "elektropay_wallets","elektropay_withdrawals","orders","payment_intents","settlement_batches","crypto_wallets",
  "crypto_assets","crypto_stores","crypto_commissions","crypto_transactions",
  "elektropay_webhook_events","surcharge_settings","bank_accounts_safe","wallets",
  "settlement_runs","payouts","billing_periods","bank_accounts","ledger_entries",
  "liquidity_pools","fx_rates","recipients","api_request_traces","kyc_verifications",
  "plaid_items","everpay_webhooks","rolling_reserves","provider_events","routing_decisions",
  "payment_attempts","merchant_processor_overrides","business_profiles","payment_processors",
  "settlements","chargeflow_disputes","kyb_documents","recipients_intl",
  "security_alerts",
]);

// Tables that exist ONLY on the local Enki DB (not on Platform OS gateway).
// All CRUD goes straight to localAdmin instead of the gateway.
const LOCAL_ONLY_TABLES = new Set<string>([
  "security_alerts",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const v = await verifyJwt(req, {
    requireRoles: ["admin", "super_admin"],
    allowExternalRoles: true,
  });
  if (!v.ok) return v.response;
  const callerId = v.userId;
  const callerEmail = v.email;
  const localAdmin = v.localAdmin;

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
      const rawMerchants: any[] = Array.isArray(r.data) ? r.data : [];

      // Pull users so we can backfill email/name when the merchant row is missing
      // them (often the case for legacy rows that only have name = email).
      let users: any[] = [];
      try {
        const ur = await gw<{ data: any[] }>("users.list");
        users = Array.isArray(ur.data) ? ur.data : [];
      } catch (e) { console.error("users.list failed", (e as Error).message); }
      // Pull KYB docs once so we can attach approved/total counts per merchant.
      let kybDocs: any[] = [];
      try {
        const kr = await gw<{ data: any[] }>("db.select", { table: "kyb_documents", limit: 5000 });
        kybDocs = Array.isArray(kr.data) ? kr.data : [];
      } catch (e) { console.error("kyb_documents fetch failed", (e as Error).message); }
      const kybByMerchant = new Map<string, { approved: number; total: number }>();
      for (const d of kybDocs) {
        const mid = d?.merchant_id; if (!mid) continue;
        const c = kybByMerchant.get(mid) || { approved: 0, total: 0 };
        c.total += 1;
        if (d.status === "approved") c.approved += 1;
        kybByMerchant.set(mid, c);
      }
      const usersById = new Map<string, any>();
      const usersByEmail = new Map<string, any>();
      for (const u of users) {
        if (u?.id) usersById.set(u.id, u);
        if (u?.email) usersByEmail.set(String(u.email).toLowerCase(), u);
      }

      const isEmail = (s: any) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
      const enriched = rawMerchants.map((m: any) => {
        const u = m?.user_id ? usersById.get(m.user_id) : null;
        const userEmail = u?.email || null;
        const userName = u?.user_metadata?.display_name || u?.raw_user_meta_data?.display_name || null;
        let email = m.email || userEmail || (isEmail(m.name) ? m.name : null);
        let name = m.name && !isEmail(m.name) ? m.name : (userName || (userEmail ? userEmail.split("@")[0] : m.name));
        const kc = kybByMerchant.get(m.id) || { approved: 0, total: 0 };
        return { ...m, email, name, kyb_approved: kc.approved, kyb_total: kc.total };
      });

      // Dedupe by merchant id ONLY. A single user may legitimately own
      // multiple merchants (e.g. test/live or multi-brand) — collapsing on
      // user_id was hiding 14 of 21 platform merchants. The external
      // Platform OS project is the single source of truth.
      const byKey = new Map<string, any>();
      for (const m of enriched) {
        if (!byKey.has(m.id)) byKey.set(m.id, m);
      }
      const deduped = Array.from(byKey.values());

      // Surface users that signed up but have no merchant row yet
      // (e.g. globeandgo18@gmail.com missing from the merchants list).
      const seenUserIds = new Set(deduped.map((m: any) => m.user_id).filter(Boolean));
      const seenEmails = new Set(deduped.map((m: any) => (m.email || "").toLowerCase()).filter(Boolean));
      for (const u of users) {
        const em = (u?.email || "").toLowerCase();
        if (!u?.id || (seenUserIds.has(u.id) || (em && seenEmails.has(em)))) continue;
        deduped.push({
          id: `user:${u.id}`,
          user_id: u.id,
          name: u.user_metadata?.display_name || u.email?.split("@")[0] || "(no name)",
          email: u.email || null,
          phone: u.phone || null,
          created_at: u.created_at || null,
          status: "pending",
          kyb_approved: 0,
          kyb_total: 0,
          profile: { onboarding_status: "pending", missing_merchant_row: true },
        });
      }

      // Stable sort: most recent first
      deduped.sort((a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      return jr({
        data: deduped,
        degraded: false,
        meta: { raw_count: rawMerchants.length, deduped_count: deduped.length, users_count: users.length },
      });
    }
    if (action === "update_merchant") {
      // body: { merchant_id, patch: { name?, email?, phone?, status? } }
      if (!body.merchant_id || !body.patch) return jr({ error: "merchant_id + patch required" }, 400);
      // Synthetic id for users without a merchant row yet -> create one first
      if (String(body.merchant_id).startsWith("user:")) {
        const uid = String(body.merchant_id).slice("user:".length);
        const name = body.patch?.name || body.patch?.email?.split("@")[0] || "New Merchant";
        let newId: string | null = null;
        try {
          const r = await gw<{ ok: boolean; merchant?: any; id?: string }>(
            "merchants.create",
            { user_id: uid, name, email: body.patch?.email ?? null, phone: body.patch?.phone ?? null },
            callerEmail || "platform-os",
          );
          newId = r.merchant?.id || r.id || null;
        } catch (e) {
          return jr({
            error: "Failed to create merchant via gateway",
            gateway_error: (e as Error).message,
            hint: "External user has no local auth record; merchant must be created in the Platform OS gateway.",
          }, 502);
        }
        if (!newId) {
          return jr({ error: "Gateway did not return new merchant id" }, 502);
        }
        body.merchant_id = newId;
      }
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
        // Gateway op may reject unknown fields (phone, region, etc).
        // Fall back to generic db.update on the gateway BEFORE touching the
        // local DB — the merchant row lives in Platform OS so a local update
        // would either no-op or fail on FK.
        try {
          const r2 = await gw<{ data: any[] }>(
            "db.update",
            { table: "merchants", id: body.merchant_id, data: patch },
            callerEmail || "platform-os",
          );
          updated = (r2.data || [])[0] || { id: body.merchant_id, ...patch };
          fallback = true;
        } catch (e2) {
          // Last resort: only attempt local update when a local row exists,
          // otherwise return a clear, actionable error.
          const { data: localRow } = await localAdmin.from("merchants").select("id").eq("id", body.merchant_id).maybeSingle();
          if (!localRow) {
            return jr({
              error: "Could not update merchant",
              gateway_error: (e as Error).message,
              gateway_fallback_error: (e2 as Error).message,
              hint: "Merchant lives in Platform OS gateway; verify the gateway accepts these fields.",
              patch_fields: Object.keys(patch),
            }, 502);
          }
          const { data, error } = await localAdmin.from("merchants").update(patch).eq("id", body.merchant_id).select().maybeSingle();
          if (error) return jr({ error: error.message, gateway_error: (e as Error).message, gateway_fallback_error: (e2 as Error).message }, 502);
          updated = data; fallback = true;
        }
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

    if (action === "update_merchant_onboarding") {
      // body: { merchant_id, onboarding_status: 'pending'|'approved'|'rejected' }
      const ALLOWED = ["pending", "approved", "rejected"];
      if (!body.merchant_id || !ALLOWED.includes(body.onboarding_status)) {
        return jr({ error: "merchant_id + onboarding_status (pending|approved|rejected) required" }, 400);
      }
      if (String(body.merchant_id).startsWith("user:")) {
        return jr({ error: "This user has no merchant record yet. Edit and save name/email first to create one." }, 409);
      }
      const reviewer = callerEmail || "platform-os";
      const at = new Date().toISOString();
      const profilePatch: any = { merchant_id: body.merchant_id, onboarding_status: body.onboarding_status };
      if (body.onboarding_status === "approved") profilePatch.kyb_verified_at = at;
      let fallback = false;
      try {
        await gw("db.upsert", { table: "merchant_profiles", data: profilePatch, on_conflict: "merchant_id" }, reviewer);
      } catch {
        const { error } = await localAdmin.from("merchant_profiles").upsert(profilePatch, { onConflict: "merchant_id" });
        if (error) return jr({ error: error.message }, 502);
        fallback = true;
      }
      const auditRow = {
        user_id: callerId,
        action: "merchant.onboarding_status_change",
        entity_type: "merchant",
        entity_id: body.merchant_id,
        metadata: { reviewer_email: callerEmail, onboarding_status: body.onboarding_status, fallback, at },
      };
      try { await gw("db.insert", { table: "audit_logs", data: auditRow }, reviewer); }
      catch { await localAdmin.from("audit_logs").insert(auditRow); }
      return jr({ ok: true, fallback });
    }

    // ---- Bulk / single merchant approval (KYB + onboarding) --------------
    const approveOne = async (m: { merchant_id?: string; user_id?: string; name?: string; email?: string }) => {
      const reviewer = callerEmail || "platform-os";
      const at = new Date().toISOString();
      let merchantId = m.merchant_id && !String(m.merchant_id).startsWith("user:") ? m.merchant_id : null;

      // Create merchant row if missing
      if (!merchantId) {
        if (!m.user_id) return { ok: false, error: "user_id required to create merchant" };
        const created = await gw<{ data: any[] }>("db.insert", {
          table: "merchants",
          data: {
            user_id: m.user_id,
            name: m.name || (m.email ? m.email.split("@")[0] : "Merchant"),
            email: m.email || null,
            status: "active",
          },
        }, reviewer);
        merchantId = (created.data || [])[0]?.id;
        if (!merchantId) return { ok: false, error: "merchant_create_failed" };
      } else {
        try {
          await gw("merchants.update", { merchant_id: merchantId, patch: { status: "active" } }, reviewer);
        } catch (e) { /* non-fatal */ }
      }

      // Upsert merchant_profiles → approved
      try {
        await gw("db.upsert", {
          table: "merchant_profiles",
          data: { merchant_id: merchantId, onboarding_status: "approved", kyb_verified_at: at },
          on_conflict: "merchant_id",
        }, reviewer);
      } catch (e: any) {
        return { ok: false, error: `profile_upsert_failed: ${e?.message}` };
      }

      // Approve all KYB documents for this merchant
      let kybApproved = 0;
      try {
        const docs = await gw<{ data: any[] }>("db.select", {
          table: "kyb_documents", filters: { merchant_id: merchantId },
        });
        for (const d of (docs.data || [])) {
          if (d.status === "approved") continue;
          try {
            await gw("db.update", {
              table: "kyb_documents",
              id: d.id,
              data: { status: "approved", reviewed_at: at, reviewed_by: callerId, review_notes: "Bulk approved by admin (KYC/Plaid verified)" },
            }, reviewer);
            kybApproved++;
          } catch {}
        }
      } catch {}

      // Audit
      try {
        await gw("db.insert", {
          table: "audit_logs",
          data: {
            user_id: callerId,
            action: "merchant.approve",
            entity_type: "merchant",
            entity_id: merchantId,
            metadata: { reviewer_email: callerEmail, at, kyb_approved: kybApproved },
          },
        }, reviewer);
      } catch {}

      return { ok: true, merchant_id: merchantId, kyb_approved: kybApproved };
    };

    if (action === "approve_merchant") {
      const r = await approveOne({
        merchant_id: body.merchant_id,
        user_id: body.user_id,
        name: body.name,
        email: body.email,
      });
      return jr(r, r.ok ? 200 : 400);
    }

    if (action === "approve_all_merchants") {
      // Re-use list_merchants_full enrichment. Wrap every individual
      // approval so one bad row can never poison the bulk response, and
      // run them in bounded parallel batches so we stay under the 60s
      // edge-function wall time even with 50+ merchants.
      let raws: any[] = [];
      let users: any[] = [];
      try { raws = (await gw<{ data: any[] }>("merchants.list_full")).data || []; }
      catch (e: any) { return jr({ ok: false, error: `list_full_failed: ${e?.message || e}` }, 200); }
      try { users = (await gw<{ data: any[] }>("users.list")).data || []; } catch {}
      const usersById = new Map(users.map((u: any) => [u.id, u]));
      const seenUserIds = new Set<string>();
      const targets: Array<{ merchant_id?: string; user_id?: string; name?: string; email?: string; _label: string }> = [];
      for (const m of raws) {
        if (m.user_id) seenUserIds.add(m.user_id);
        targets.push({
          merchant_id: String(m.id).startsWith("user:") ? undefined : m.id,
          user_id: m.user_id,
          name: m.name,
          email: m.email || usersById.get(m.user_id)?.email,
          _label: m.email || m.name || m.id,
        });
      }
      for (const u of users) {
        if (!u?.id || seenUserIds.has(u.id)) continue;
        targets.push({
          user_id: u.id,
          name: u.user_metadata?.display_name || u.email?.split("@")[0],
          email: u.email,
          _label: u.email || u.id,
        });
      }
      const results: any[] = [];
      const CHUNK = 6;
      for (let i = 0; i < targets.length; i += CHUNK) {
        const slice = targets.slice(i, i + CHUNK);
        const settled = await Promise.allSettled(
          slice.map((t) => approveOne(t).catch((e: any) => ({ ok: false, error: e?.message || String(e) }))),
        );
        slice.forEach((t, idx) => {
          const s = settled[idx];
          const base = { label: t._label, email: t.email, merchant_id: t.merchant_id, user_id: t.user_id };
          if (s.status === "fulfilled") results.push({ ...base, ...s.value });
          else results.push({ ...base, ok: false, error: (s.reason as any)?.message || String(s.reason) });
        });
      }
      const summary = {
        total: results.length,
        approved: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        kyb_approved: results.reduce((n, r) => n + (Number(r.kyb_approved) || 0), 0),
      };
      return jr({ ok: true, summary, results });
    }
    // ----------------------------------------------------------------------

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
    if (action === "backfill_provider_events") {
      // body: { merchant_id, currency?, since?, limit? }
      if (!body.merchant_id) return jr({ error: "merchant_id required" }, 400);
      const currency = body.currency ? String(body.currency).toUpperCase() : null;
      const limit = Math.min(Math.max(Number(body.limit) || 500, 1), 2000);
      const since = body.since ? String(body.since) : null;

      const filters: Record<string, any> = { merchant_id: body.merchant_id };
      if (currency) filters.currency = currency;

      let fetched: any[] = [];
      try {
        const r = await gw<{ data: any[] }>("db.select", {
          table: "provider_events",
          filters,
          order: { column: "created_at", ascending: false },
          limit,
        });
        fetched = r.data || [];
      } catch (e) {
        return jr({ error: "gateway fetch failed", detail: (e as Error).message }, 502);
      }
      if (since) {
        const t = new Date(since).getTime();
        fetched = fetched.filter((row) => new Date(row.created_at || 0).getTime() >= t);
      }

      // De-duplicate against local rows by id
      const ids = fetched.map((r) => r.id).filter(Boolean);
      let existingIds = new Set<string>();
      if (ids.length) {
        const { data: existing } = await localAdmin
          .from("provider_events").select("id").in("id", ids);
        existingIds = new Set((existing || []).map((r: any) => r.id));
      }
      const toInsert = fetched.filter((r) => r.id && !existingIds.has(r.id));
      let inserted = 0;
      if (toInsert.length) {
        const { error, data: ins } = await localAdmin
          .from("provider_events")
          .upsert(toInsert, { onConflict: "id", ignoreDuplicates: true })
          .select("id");
        if (error) return jr({ error: `insert failed: ${error.message}` }, 500);
        inserted = (ins || []).length;
      }

      // Idempotent audit entry: dedupe by metadata.dedupe_key
      const dedupeKey = `provider_events_backfill:${body.merchant_id}:${currency || "ALL"}:${since || "all"}:${new Date().toISOString().slice(0, 16)}`;
      const { data: existingAudit } = await localAdmin
        .from("audit_logs").select("id")
        .eq("entity_type", "merchant").eq("entity_id", body.merchant_id)
        .contains("metadata", { dedupe_key: dedupeKey })
        .limit(1);
      if (!existingAudit || existingAudit.length === 0) {
        const auditRow = {
          user_id: callerId,
          action: "merchant.backfill_provider_events",
          entity_type: "merchant",
          entity_id: body.merchant_id,
          metadata: {
            dedupe_key: dedupeKey,
            currency, since, limit,
            fetched: fetched.length,
            inserted,
            skipped_duplicates: fetched.length - inserted,
            by: callerEmail,
            at: new Date().toISOString(),
          },
        };
        try { await gw("db.insert", { table: "audit_logs", data: auditRow }, callerEmail || "platform-os"); }
        catch { await localAdmin.from("audit_logs").insert(auditRow); }
      }
      return jr({ ok: true, fetched: fetched.length, inserted, skipped_duplicates: fetched.length - inserted, dedupe_key: dedupeKey });
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
      if (LOCAL_ONLY_TABLES.has(table)) {
        let q: any = localAdmin.from(table).select(select || "*", count ? { count: "exact" } : undefined);
        if (filters && typeof filters === "object") {
          for (const [k, v] of Object.entries(filters)) {
            if (Array.isArray(v)) q = q.in(k, v);
            else if (v === null) q = q.is(k, null);
            else q = q.eq(k, v);
          }
        }
        if (order) {
          const orders = Array.isArray(order) ? order : [order];
          for (const o of orders) q = q.order(o.column, { ascending: o.ascending !== false });
        }
        if (typeof limit === "number") q = q.limit(limit);
        if (typeof offset === "number" && typeof limit === "number") q = q.range(offset, offset + limit - 1);
        const { data: rows, count: cnt, error: lerr } = await q;
        if (lerr) return jr({ error: lerr.message }, 500);
        return jr({ data: rows || [], count: cnt ?? null });
      }
      try {
        const r = await gw<{ data: any[]; count: number | null }>("db.select", {
          table, select, filters, order, limit, offset, count,
        });
        return jr({ data: r.data, count: r.count, degraded: false });
      } catch (gwErr) {
        // Fallback to local DB when external gateway fails (table may not
        // exist on the platform OS or gateway is degraded).
        console.warn(`gateway db.select failed for ${table}, falling back to local:`, (gwErr as Error).message);
        let q: any = localAdmin.from(table).select(select || "*", count ? { count: "exact" } : undefined);
        if (filters && typeof filters === "object") {
          for (const [k, v] of Object.entries(filters)) {
            if (Array.isArray(v)) q = q.in(k, v);
            else if (v === null) q = q.is(k, null);
            else q = q.eq(k, v);
          }
        }
        if (order) {
          const orders = Array.isArray(order) ? order : [order];
          for (const o of orders) q = q.order(o.column, { ascending: o.ascending !== false });
        }
        if (typeof limit === "number") q = q.limit(limit);
        if (typeof offset === "number" && typeof limit === "number") q = q.range(offset, offset + limit - 1);
        const { data: rows, count: cnt, error: lerr } = await q;
        if (lerr) {
          // Table may not exist locally (e.g. crypto_assets only lives on platform OS).
          // Return empty result set instead of 500 so the UI degrades gracefully.
          console.warn(`local fallback failed for ${table}: ${lerr.message}`);
          return jr({ data: [], count: 0, degraded: true, error: lerr.message });
        }
        return jr({ data: rows || [], count: cnt ?? null, degraded: true });
      }
    }
    if (action === "insert") {
      if (!data) return jr({ error: "data required" }, 400);
      if (LOCAL_ONLY_TABLES.has(table)) {
        const { data: rows, error } = await localAdmin.from(table).insert(data).select();
        if (error) return jr({ error: error.message }, 500);
        return jr({ data: rows || [] });
      }
      const r = await gw<{ data: any[] }>("db.insert", { table, data }, callerEmail || "platform-os");
      return jr({ data: r.data });
    }
    if (action === "update") {
      if (!id || !data) return jr({ error: "id and data required" }, 400);
      if (LOCAL_ONLY_TABLES.has(table)) {
        const { data: rows, error } = await localAdmin.from(table).update(data).eq("id", id).select();
        if (error) return jr({ error: error.message }, 500);
        return jr({ data: rows || [] });
      }
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
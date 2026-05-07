import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REBELFI_API_KEY = Deno.env.get("REBELFI_API_KEY") || "";
const REBELFI_BASE = REBELFI_API_KEY.startsWith("rfk_sandbox_")
  ? "https://sandbox-api.rebelfi.io/v1"
  : "https://api.rebelfi.io/v1";

async function rfFetch(path: string) {
  const res = await fetch(`${REBELFI_BASE}${path}`, {
    headers: { "x-api-key": REBELFI_API_KEY, "Content-Type": "application/json" },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, body: json };
}

const toUnits = (s: any, decimals = 6) => {
  const n = typeof s === "number" ? s : Number(s);
  if (!Number.isFinite(n)) return 0;
  return n / Math.pow(10, decimals);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    if (!REBELFI_API_KEY) {
      return new Response(JSON.stringify({ error: "REBELFI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roleRows || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    let merchantId: string | undefined = body.merchant_id;
    if (!merchantId) {
      const { data: m } = await admin.from("merchants").select("id").eq("user_id", userData.user.id).maybeSingle();
      merchantId = m?.id;
    }
    if (!merchantId) {
      return new Response(JSON.stringify({ error: "No merchant_id provided and no default merchant for user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const opsR = await rfFetch(`/operations?limit=100`);
    if (!opsR.ok) {
      const errPayload = { error: "RebelFi operations fetch failed", status: opsR.status, body: opsR.body };
      await admin.from("rebelfi_sync_runs").insert({
        user_id: userData.user.id, merchant_id: merchantId, status: "failed",
        errors: [errPayload], duration_ms: Date.now() - t0,
      });
      return new Response(JSON.stringify(errPayload),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const operations: any[] = (opsR.body?.operations || opsR.body?.data || opsR.body || []) as any[];

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];
    const affectedAccountIds = new Set<string>();
    const insertedTxIds: string[] = [];

    for (const op of Array.isArray(operations) ? operations : []) {
      const opId = op.id || op.operation_id || op.uuid;
      if (!opId) { skipped++; continue; }
      const type = (op.type || op.operation_type || "").toString().toLowerCase();
      const isCredit = ["yield","interest","earnings","allocation_yield","reward","deposit","supply"].some((t) => type.includes(t));
      const amountUnits = toUnits(op.amount ?? op.value ?? op.netAmount ?? 0);
      if (!isCredit || amountUnits <= 0) { skipped++; continue; }

      const currency = (op.currency || op.asset || op.token || "USDC").toString().toUpperCase();
      const ledgerCurrency = currency === "USDC" || currency === "USDT" ? "USD" : currency;
      const idemKey = `rebelfi:${opId}`;
      const opStatus = (op.status || "").toString().toLowerCase();

      const { data: existing } = await admin.from("transactions")
        .select("id, status").eq("idempotency_key", idemKey).maybeSingle();

      if (existing) {
        if (opStatus && opStatus !== existing.status) {
          await admin.from("transactions").update({
            status: opStatus === "confirmed" || opStatus === "completed" ? "completed" : opStatus,
            metadata: { rebelfi: op }, updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      const { data: tx, error: txErr } = await admin.from("transactions").insert({
        merchant_id: merchantId,
        amount: amountUnits,
        currency: ledgerCurrency,
        status: "completed",
        provider: "rebelfi",
        provider_ref: opId,
        description: `RebelFi ${type || "yield"}${op.venueId ? ` @ venue ${op.venueId}` : ""}`,
        idempotency_key: idemKey,
        metadata: { rebelfi: op },
      }).select("id").single();
      if (txErr || !tx) { errors.push({ opId, error: txErr?.message || "tx insert failed" }); continue; }
      insertedTxIds.push(tx.id);

      let { data: acct } = await admin.from("accounts").select("id")
        .eq("merchant_id", merchantId).eq("currency", ledgerCurrency).maybeSingle();
      if (!acct) {
        const { data: newAcct, error: acctErr } = await admin.from("accounts").insert({
          merchant_id: merchantId, currency: ledgerCurrency,
          balance: 0, pending_balance: 0, available_balance: 0,
        }).select("id").single();
        if (acctErr || !newAcct) { errors.push({ opId, error: acctErr?.message || "account create failed" }); continue; }
        acct = newAcct;
      }
      affectedAccountIds.add(acct.id);

      const { error: leErr } = await admin.from("ledger_entries").insert([
        { transaction_id: tx.id, account_id: acct.id, entry_type: "credit", amount: amountUnits, currency: ledgerCurrency },
      ]);
      if (leErr) { errors.push({ opId, error: leErr.message }); continue; }

      const { data: cur } = await admin.from("accounts").select("balance, available_balance").eq("id", acct.id).single();
      await admin.from("accounts").update({
        balance: Number(cur?.balance || 0) + amountUnits,
        available_balance: Number(cur?.available_balance || 0) + amountUnits,
        updated_at: new Date().toISOString(),
      }).eq("id", acct.id);

      inserted++;
    }

    // Verification: confirm ledger_entries + accounts reflect the inserted txs
    const verification: any = { ledger_entries_found: 0, accounts: [] };
    if (insertedTxIds.length > 0) {
      const { data: les } = await admin.from("ledger_entries")
        .select("id, transaction_id, account_id, amount, entry_type")
        .in("transaction_id", insertedTxIds);
      verification.ledger_entries_found = les?.length || 0;
      verification.expected_ledger_entries = insertedTxIds.length;
    }
    if (affectedAccountIds.size > 0) {
      const { data: accts } = await admin.from("accounts")
        .select("id, currency, balance, available_balance")
        .in("id", Array.from(affectedAccountIds));
      verification.accounts = accts || [];
    }
    verification.dashboard_consistent =
      verification.ledger_entries_found === insertedTxIds.length;

    await admin.from("rebelfi_sync_runs").insert({
      user_id: userData.user.id,
      merchant_id: merchantId,
      status: errors.length ? "partial" : "success",
      scanned: operations.length || 0,
      inserted, updated, skipped,
      errors,
      verification,
      duration_ms: Date.now() - t0,
    });

    return new Response(JSON.stringify({
      ok: true, merchant_id: merchantId,
      scanned: operations.length || 0, inserted, updated, skipped, errors, verification,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

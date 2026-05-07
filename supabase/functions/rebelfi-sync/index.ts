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

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function classifyOp(op: any) {
  const opId = op.id || op.operation_id || op.uuid;
  const type = (op.type || op.operation_type || "").toString().toLowerCase();
  const isCredit = ["yield","interest","earnings","allocation_yield","reward","deposit","supply"].some((t) => type.includes(t));
  const amountUnits = toUnits(op.amount ?? op.value ?? op.netAmount ?? 0);
  const currency = (op.currency || op.asset || op.token || "USDC").toString().toUpperCase();
  const ledgerCurrency = currency === "USDC" || currency === "USDT" ? "USD" : currency;
  return { opId, type, isCredit, amountUnits, currency, ledgerCurrency };
}

async function runSync(admin: any, opts: {
  userId: string | null;
  merchantId: string;
  source: "manual" | "preview" | "poll";
  dryRun: boolean;
}) {
  const t0 = Date.now();
  const opsR = await rfFetch(`/operations?limit=100`);
  if (!opsR.ok) {
    const errPayload = { error: "RebelFi operations fetch failed", status: opsR.status, body: opsR.body };
    if (!opts.dryRun) {
      await admin.from("rebelfi_sync_runs").insert({
        user_id: opts.userId, merchant_id: opts.merchantId, status: "failed",
        errors: [errPayload], duration_ms: Date.now() - t0,
        source: opts.source, dry_run: opts.dryRun,
      });
    }
    return { ok: false, ...errPayload };
  }
  const operations: any[] = (opsR.body?.operations || opsR.body?.data || opsR.body || []) as any[];

  let inserted = 0, updated = 0, skipped = 0;
  const errors: any[] = [];
  const skippedDetails: any[] = [];
  const previewDeltas: Record<string, { credit: number; new_tx: number }> = {};
  const affectedAccountIds = new Set<string>();
  const insertedTxIds: string[] = [];

  for (const op of Array.isArray(operations) ? operations : []) {
    const c = classifyOp(op);
    if (!c.opId) { skipped++; skippedDetails.push({ reason: "no_op_id", op }); continue; }
    if (!c.isCredit || c.amountUnits <= 0) {
      skipped++;
      skippedDetails.push({ reason: "not_creditable", opId: c.opId, type: c.type, amount: c.amountUnits });
      continue;
    }
    const idemKey = `rebelfi:${c.opId}`;
    const opStatus = (op.status || "").toString().toLowerCase();

    // existing tx check (always run, even in dry-run, to know if we'd insert)
    const { data: existing } = await admin.from("transactions")
      .select("id, status, amount, currency").eq("idempotency_key", idemKey).maybeSingle();

    if (existing) {
      // pull matching ledger entries for visibility
      const { data: les } = await admin.from("ledger_entries")
        .select("id, account_id, entry_type, amount, currency, created_at")
        .eq("transaction_id", existing.id);

      if (opStatus && opStatus !== existing.status) {
        if (!opts.dryRun) {
          await admin.from("transactions").update({
            status: opStatus === "confirmed" || opStatus === "completed" ? "completed" : opStatus,
            metadata: { rebelfi: op }, updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        }
        updated++;
      } else {
        skipped++;
        skippedDetails.push({
          reason: "idempotency_conflict",
          opId: c.opId,
          idempotency_key: idemKey,
          existing_transaction_id: existing.id,
          existing_status: existing.status,
          existing_amount: existing.amount,
          existing_currency: existing.currency,
          ledger_entries: les || [],
        });
      }
      continue;
    }

    // would insert / actually insert
    previewDeltas[c.ledgerCurrency] = previewDeltas[c.ledgerCurrency] || { credit: 0, new_tx: 0 };
    previewDeltas[c.ledgerCurrency].credit += c.amountUnits;
    previewDeltas[c.ledgerCurrency].new_tx += 1;

    if (opts.dryRun) { inserted++; continue; }

    const { data: tx, error: txErr } = await admin.from("transactions").insert({
      merchant_id: opts.merchantId,
      amount: c.amountUnits,
      currency: c.ledgerCurrency,
      status: "completed",
      provider: "rebelfi",
      provider_ref: c.opId,
      description: `RebelFi ${c.type || "yield"}${op.venueId ? ` @ venue ${op.venueId}` : ""}`,
      idempotency_key: idemKey,
      metadata: { rebelfi: op },
    }).select("id").single();
    if (txErr || !tx) { errors.push({ opId: c.opId, error: txErr?.message || "tx insert failed" }); continue; }
    insertedTxIds.push(tx.id);

    let { data: acct } = await admin.from("accounts").select("id, balance, available_balance")
      .eq("merchant_id", opts.merchantId).eq("currency", c.ledgerCurrency).maybeSingle();
    if (!acct) {
      const { data: newAcct, error: acctErr } = await admin.from("accounts").insert({
        merchant_id: opts.merchantId, currency: c.ledgerCurrency,
        balance: 0, pending_balance: 0, available_balance: 0,
      }).select("id, balance, available_balance").single();
      if (acctErr || !newAcct) { errors.push({ opId: c.opId, error: acctErr?.message || "account create failed" }); continue; }
      acct = newAcct;
    }
    affectedAccountIds.add(acct.id);

    const { error: leErr } = await admin.from("ledger_entries").insert([
      { transaction_id: tx.id, account_id: acct.id, entry_type: "credit", amount: c.amountUnits, currency: c.ledgerCurrency },
    ]);
    if (leErr) { errors.push({ opId: c.opId, error: leErr.message }); continue; }

    await admin.from("accounts").update({
      balance: Number(acct.balance || 0) + c.amountUnits,
      available_balance: Number(acct.available_balance || 0) + c.amountUnits,
      updated_at: new Date().toISOString(),
    }).eq("id", acct.id);

    inserted++;
  }

  const verification: any = { ledger_entries_found: 0, accounts: [], expected_ledger_entries: insertedTxIds.length };
  if (!opts.dryRun && insertedTxIds.length > 0) {
    const { data: les } = await admin.from("ledger_entries")
      .select("id, transaction_id, account_id, amount, entry_type")
      .in("transaction_id", insertedTxIds);
    verification.ledger_entries_found = les?.length || 0;
  }
  if (!opts.dryRun && affectedAccountIds.size > 0) {
    const { data: accts } = await admin.from("accounts")
      .select("id, currency, balance, available_balance")
      .in("id", Array.from(affectedAccountIds));
    verification.accounts = accts || [];
  }
  verification.dashboard_consistent = opts.dryRun ? true :
    verification.ledger_entries_found === insertedTxIds.length;

  // Preflight preview: estimate post-sync balances
  let preview: any = null;
  if (opts.dryRun) {
    const currencies = Object.keys(previewDeltas);
    const { data: currentAccts } = currencies.length
      ? await admin.from("accounts")
          .select("id, currency, balance, available_balance")
          .eq("merchant_id", opts.merchantId)
          .in("currency", currencies)
      : { data: [] as any[] };
    preview = {
      currencies: currencies.map((cur) => {
        const acct = (currentAccts || []).find((a: any) => a.currency === cur);
        const delta = previewDeltas[cur];
        return {
          currency: cur,
          new_transactions: delta.new_tx,
          credit_delta: delta.credit,
          current_balance: Number(acct?.balance || 0),
          projected_balance: Number(acct?.balance || 0) + delta.credit,
          current_available: Number(acct?.available_balance || 0),
          projected_available: Number(acct?.available_balance || 0) + delta.credit,
        };
      }),
      totals: {
        new_transactions: inserted,
        updated_transactions: updated,
        skipped: skipped,
        idempotency_conflicts: skippedDetails.filter((s) => s.reason === "idempotency_conflict").length,
      },
    };
  }

  if (!opts.dryRun) {
    await admin.from("rebelfi_sync_runs").insert({
      user_id: opts.userId,
      merchant_id: opts.merchantId,
      status: errors.length ? "partial" : "success",
      scanned: operations.length || 0,
      inserted, updated, skipped,
      errors,
      verification,
      skipped_details: skippedDetails,
      duration_ms: Date.now() - t0,
      source: opts.source,
      dry_run: false,
    });
  }

  return {
    ok: true, merchant_id: opts.merchantId,
    scanned: operations.length || 0,
    inserted, updated, skipped, errors, verification,
    skipped_details: skippedDetails,
    preview,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!REBELFI_API_KEY) return json({ ok: false, error: "REBELFI_API_KEY not configured" });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: string = body.action || "sync";
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ---- Cron / poll trigger: signed via service role secret in header ----
    if (action === "poll_tick") {
      const secret = req.headers.get("x-poll-secret") || "";
      if (secret !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        return json({ ok: false, error: "Unauthorized poll" }, 200);
      }
      const { data: settings } = await admin.from("rebelfi_poll_settings")
        .select("*").limit(1).maybeSingle();
      if (!settings || !settings.enabled) return json({ ok: true, skipped: "polling_disabled" });
      const now = Date.now();
      const last = settings.last_run_at ? new Date(settings.last_run_at).getTime() : 0;
      const interval = (settings.interval_seconds || 300) * 1000;
      if (now - last < interval) return json({ ok: true, skipped: "interval_not_elapsed" });

      let merchantId = settings.merchant_id;
      if (!merchantId) {
        const { data: m } = await admin.from("merchants").select("id").limit(1).maybeSingle();
        merchantId = m?.id;
      }
      if (!merchantId) return json({ ok: false, error: "No merchant configured for polling" });

      try {
        const result: any = await runSync(admin, { userId: null, merchantId, source: "poll", dryRun: false });
        await admin.from("rebelfi_poll_settings").update({
          last_run_at: new Date().toISOString(),
          last_status: result.ok ? "success" : "failed",
          last_error: result.ok ? null : (result.error || null),
        }).eq("id", settings.id);
        return json(result);
      } catch (e: any) {
        await admin.from("rebelfi_poll_settings").update({
          last_run_at: new Date().toISOString(),
          last_status: "failed",
          last_error: e?.message || String(e),
        }).eq("id", settings.id);
        return json({ ok: false, error: e?.message || String(e) });
      }
    }

    // ---- Standard auth path for sync / preview ----
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) return json({ ok: false, error: "Unauthorized" });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ ok: false, error: "Unauthorized" });
    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roleRows || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) return json({ ok: false, error: "Forbidden — admin role required" });

    let merchantId: string | undefined = body.merchant_id;
    if (!merchantId) {
      const { data: m } = await admin.from("merchants").select("id").eq("user_id", userData.user.id).maybeSingle();
      merchantId = m?.id;
    }
    if (!merchantId) return json({ ok: false, error: "No merchant_id provided and no default merchant for user" });

    const dryRun = action === "preview" || body.dry_run === true;
    const result = await runSync(admin, {
      userId: userData.user.id,
      merchantId,
      source: dryRun ? "preview" : "manual",
      dryRun,
    });
    return json(result);
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) });
  }
});

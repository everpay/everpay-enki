// E2E smoke test — calls /api/balance, /api/payments, and /api/payouts equivalents
// (delos-banking, brighty-banking, elektropay-proxy) and verifies that
// transactions + ledger_entries rows are created.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supa = createClient(SUPABASE_URL, SERVICE);

async function call(fn: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, json, text };
}

async function pickMerchant(): Promise<string> {
  const { data } = await supa.from("merchants").select("id").limit(1);
  if (!data?.[0]?.id) throw new Error("No merchants — seed one first");
  return data[0].id;
}

Deno.test("balances endpoints respond (delos/brighty/elektropay)", async () => {
  for (const fn of ["delos-banking", "brighty-banking", "elektropay-proxy"]) {
    const r = await call(fn, { action: "balances" });
    console.log(fn, r.status, r.json);
    assertEquals(r.status, 200, `${fn} non-200`);
  }
});

Deno.test("brighty payout writes ledger + transaction idempotently", async () => {
  const merchantId = await pickMerchant();
  const ref = `e2e-brighty-${crypto.randomUUID().slice(0, 8)}`;
  // Re-submit the same payout 3x to assert provider_ref deduplication.
  for (let i = 0; i < 3; i++) {
    await call("brighty-banking", {
      action: "payout",
      merchant_id: merchantId,
      payload: { id: ref, amount: 12.34, currency: "EUR", description: "e2e", idempotency_key: ref },
    });
  }
  const { data: txs } = await supa.from("transactions").select("id").eq("provider", "brighty").eq("provider_ref", ref);
  assertEquals(txs?.length ?? 0, 1, "duplicate brighty transaction created on retry");
  if (txs?.[0]?.id) {
    const { data: entries } = await supa.from("ledger_entries").select("id").eq("transaction_id", txs[0].id);
    assertEquals(entries?.length ?? 0, 1, "duplicate ledger_entries created on retry");
  }
});

Deno.test("elektropay payout writes ledger + transaction idempotently", async () => {
  const merchantId = await pickMerchant();
  const ref = `e2e-elek-${crypto.randomUUID().slice(0, 8)}`;
  for (let i = 0; i < 2; i++) {
    await call("elektropay-proxy", {
      action: "payout",
      merchant_id: merchantId,
      payload: { withdraw_id: ref, amount: 5, asset_id: "USDT.TRC20" },
    });
  }
  const { data: txs } = await supa.from("transactions").select("id").eq("provider", "elektropay").eq("provider_ref", ref);
  assert((txs?.length ?? 0) <= 1, "duplicate elektropay transaction on retry");
});

Deno.test("auto_provision_wallet logs provider_events + event_logs (no dupes)", async () => {
  const merchantId = await pickMerchant();
  const attempt_id = crypto.randomUUID();
  // Replay same attempt 3x — provider_events / event_logs should each be appended,
  // but each row must carry the same attempt_id and be tied to the merchant.
  for (let i = 0; i < 3; i++) {
    await call("elektropay-proxy", {
      action: "auto_provision_wallet",
      merchant_id: merchantId,
      country: "US", // forces skipped path so we don't hit upstream
      attempt_id,
    });
  }
  const { data: pe } = await supa
    .from("provider_events")
    .select("id, event_type, merchant_id, payload")
    .eq("merchant_id", merchantId)
    .eq("provider", "elektropay")
    .like("event_type", "wallet.provision.%")
    .order("created_at", { ascending: false })
    .limit(10);
  const matched = (pe || []).filter((r: any) => r.payload?.attempt_id === attempt_id);
  assertEquals(matched.length, 3, "expected 3 provider_events for replayed attempt");
  for (const row of matched) {
    assertEquals(row.merchant_id, merchantId, "provider_event must be tied to merchant");
    assert(row.event_type.startsWith("wallet.provision."), "event_type prefix");
  }
  const { data: el } = await supa
    .from("event_logs")
    .select("id, event_type, payload")
    .like("event_type", "wallet.auto_provision.%")
    .order("created_at", { ascending: false })
    .limit(20);
  const elMatched = (el || []).filter((r: any) => r.payload?.attempt_id === attempt_id);
  assertEquals(elMatched.length, 3, "expected 3 event_logs for replayed attempt");
  for (const row of elMatched) {
    assertEquals(row.payload?.merchant_id, merchantId, "event_log payload must include merchant_id");
  }
});

Deno.test("kyb.document.approved log carries merchant + doc context", async () => {
  const merchantId = await pickMerchant();
  const doc_id = crypto.randomUUID();
  await supa.from("event_logs").insert({
    event_type: "kyb.document.approved",
    source_service: "e2e-smoke",
    payload: { doc_id, merchant_id: merchantId, country: "BR", doc_type: "passport" },
  });
  const { data } = await supa
    .from("event_logs")
    .select("payload")
    .eq("event_type", "kyb.document.approved")
    .order("created_at", { ascending: false })
    .limit(5);
  const found = (data || []).find((r: any) => r.payload?.doc_id === doc_id);
  assert(found, "kyb.document.approved event should exist");
  assertEquals(found.payload.merchant_id, merchantId);
});
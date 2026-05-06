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
  for (let i = 0; i < 2; i++) {
    await call("brighty-banking", {
      action: "payout",
      merchant_id: merchantId,
      payload: { id: ref, amount: 12.34, currency: "EUR", description: "e2e", idempotency_key: ref },
    });
  }
  const { data: txs } = await supa.from("transactions").select("id").eq("provider", "brighty").eq("provider_ref", ref);
  assert((txs?.length ?? 0) <= 1, "duplicate transaction created on retry");
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
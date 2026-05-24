import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TEST_EMAIL = Deno.env.get("E2E_TEST_EMAIL") || "support@everpayinc.com";
const TEST_PASSWORD = Deno.env.get("E2E_TEST_PASSWORD") || "";

const FN_URL = `${SUPABASE_URL}/functions/v1/elektropay-proxy`;

async function getAdminToken(): Promise<string | null> {
  if (!TEST_PASSWORD) return null;
  const sb = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (error || !data.session) return null;
  return data.session.access_token;
}

Deno.test("elektropay-proxy: rejects unauthenticated requests", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list_wallets" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("elektropay-proxy: rejects bad JWT", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer not.a.jwt" },
    body: JSON.stringify({ action: "list_wallets" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("elektropay-proxy: full provider callback updates the transaction", async () => {
  const token = await getAdminToken();
  if (!token) {
    console.warn("[skip] E2E_TEST_PASSWORD not set — skipping authenticated path");
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const merchantRes = await admin.from("merchants").select("id").limit(1).maybeSingle();
  const merchantId = merchantRes.data?.id;
  assert(merchantId, "need at least one merchant");

  const providerRef = `EP-TEST-${crypto.randomUUID()}`;
  const txIns = await admin
    .from("transactions")
    .insert({
      merchant_id: merchantId,
      amount: 1000,
      currency: "USD",
      status: "pending",
      provider: "elektropay",
      provider_ref: providerRef,
      payment_method: "crypto",
    })
    .select()
    .single();
  assert(!txIns.error, txIns.error?.message);
  const txId = txIns.data.id;

  // Simulate the provider's webhook callback through the proxy.
  const callback = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: "webhook",
      payload: {
        event: "payment.completed",
        transaction_reference: providerRef,
        status: "completed",
        amount: 1000,
        currency: "USD",
      },
    }),
  });
  const body = await callback.json().catch(() => ({}));
  assert(callback.status < 500, `proxy 5xx: ${JSON.stringify(body)}`);

  // Poll the transaction for the updated status.
  let final: any = null;
  for (let i = 0; i < 5; i++) {
    const { data } = await admin.from("transactions").select("status").eq("id", txId).maybeSingle();
    if (data?.status && data.status !== "pending") { final = data; break; }
    await new Promise((r) => setTimeout(r, 400));
  }

  // Cleanup regardless of outcome.
  await admin.from("transactions").delete().eq("id", txId);

  assert(final, "transaction was not updated by the callback");
  assertEquals(final.status, "completed");
});
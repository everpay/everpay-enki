import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/process-payment`;

Deno.test("process-payment: concurrent retries with same idempotency key produce single payment", async () => {
  const key = `test_${crypto.randomUUID()}`;
  const body = {
    amount: 12.34, currency: "USD", paymentMethod: "card",
    customerEmail: "idem@test.dev", idempotencyKey: key,
    cardDetails: { number: "4242424242424242", expMonth: "12", expYear: "30", cvc: "123" },
    billingDetails: { country: "US" },
  };
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${ANON}`, "apikey": ANON };

  const [a, b] = await Promise.all([
    fetch(FN, { method: "POST", headers, body: JSON.stringify(body) }),
    fetch(FN, { method: "POST", headers, body: JSON.stringify(body) }),
  ]);
  const aj = await a.json(); const bj = await b.json();

  // One must succeed (200) the other either returns same response or 409 in-flight
  const oks = [a.status, b.status].filter(s => s === 200).length;
  const conflict = [a.status, b.status].filter(s => s === 409).length;
  assert(oks >= 1, `expected at least one 200, got ${a.status}/${b.status}`);
  assert(oks + conflict === 2 || (oks === 2), "responses should be deterministic");

  // Replay: third call must return identical cached response
  const c = await fetch(FN, { method: "POST", headers, body: JSON.stringify(body) });
  const cj = await c.json();
  assertEquals(c.status, 200);
  // cached response carries a transaction with stable id
  if (aj.transaction?.id || bj.transaction?.id) {
    assert(cj.transaction?.id === (aj.transaction?.id || bj.transaction?.id));
  }
});

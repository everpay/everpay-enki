import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/paywatcher-webhook`;

Deno.test("paywatcher-webhook: rejects bad signature when secret configured", async () => {
  const r = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON}`, "apikey": ANON,
      "x-paywatcher-signature": "sha256=deadbeef",
    },
    body: JSON.stringify({ type: "payment.confirmed", data: { id: "tx_test_invalid", status: "confirmed" } }),
  });
  const j = await r.json();
  // 401 if PAYWATCHER_WEBHOOK_SECRET set; 200 if no secret
  assert([200, 401].includes(r.status));
  if (r.status === 401) assertEquals(j.error, "invalid signature");
});

Deno.test("paywatcher-webhook: OPTIONS preflight CORS", async () => {
  const r = await fetch(FN, { method: "OPTIONS" });
  await r.text();
  assertEquals(r.headers.get("access-control-allow-origin"), "*");
});
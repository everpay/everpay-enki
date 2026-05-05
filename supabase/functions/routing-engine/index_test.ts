import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/routing-engine`;

async function route(body: Record<string, unknown>) {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

const CASES = [
  { name: "USD/US default", body: { amount: 100, currency: "USD", country: "US" }, expectIn: ["shieldhub", "mondo"] },
  { name: "EUR/DE", body: { amount: 100, currency: "EUR", country: "DE" }, expectIn: ["mondo", "shieldhub"] },
  { name: "GBP/GB", body: { amount: 100, currency: "GBP", country: "GB" }, expectIn: ["mondo", "shieldhub"] },
  { name: "BRL/BR", body: { amount: 100, currency: "BRL", country: "BR" }, expectIn: ["paygate10", "shieldhub"] },
  { name: "MXN/MX", body: { amount: 100, currency: "MXN", country: "MX" }, expectIn: ["paygate10", "shieldhub"] },
  { name: "BDT/BD", body: { amount: 100, currency: "BDT", country: "BD" }, expectIn: ["makapay", "shieldhub"] },
  { name: "KES/KE", body: { amount: 100, currency: "KES", country: "KE" }, expectIn: ["lipad", "shieldhub"] },
  { name: "TRY/TR", body: { amount: 100, currency: "TRY", country: "TR" }, expectIn: ["payok", "shieldhub"] },
  { name: "high-risk blocked", body: { amount: 100, currency: "USD", country: "US", risk_score: 95 }, expectBlocked: true },
];

Deno.test("routing-engine: cross-currency decisioning checklist", async () => {
  const checklist: string[] = [];
  let failed = 0;
  for (const c of CASES) {
    try {
      const { status, json } = await route(c.body);
      if (c.expectBlocked) {
        const ok = json?.blocked === true;
        checklist.push(`${ok ? "PASS" : "FAIL"} ${c.name} blocked=${json?.blocked}`);
        if (!ok) failed++;
        continue;
      }
      const provider = json?.provider as string | null;
      const ok = status === 200 && provider && c.expectIn?.includes(provider);
      checklist.push(`${ok ? "PASS" : "FAIL"} ${c.name} -> ${provider} (score ${json?.score})`);
      if (!ok) failed++;
    } catch (e) {
      checklist.push(`FAIL ${c.name} threw ${(e as Error).message}`);
      failed++;
    }
  }
  console.log("\n=== Routing Smoke Checklist ===\n" + checklist.join("\n") + "\n");
  assertEquals(failed, 0, `${failed} routing case(s) failed`);
});

Deno.test("routing-engine: idempotency", async () => {
  const body = { amount: 250, currency: "EUR", country: "FR", card_brand: "visa" };
  const a = await route(body);
  const b = await route(body);
  assertEquals(a.json.provider, b.json.provider, "provider must be stable for identical input");
  assert(typeof a.json.score === "number", "score must be numeric");
});

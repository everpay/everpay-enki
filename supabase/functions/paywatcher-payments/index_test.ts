import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/paywatcher-payments`;

async function call(body: Record<string, unknown>, init: RequestInit = {}) {
  const r = await fetch(FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON}`, "apikey": ANON, ...(init.headers || {}) },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  return { status: r.status, json: j };
}

Deno.test("paywatcher: ping returns provider metadata", async () => {
  const { status, json } = await call({ action: "ping" });
  assertEquals(status, 200);
  assertEquals(json.provider, "paywatcher");
  assertEquals(json.network, "BASE");
  assertEquals(json.cost_usdc, 0.05);
  assertEquals(json.charge_usdc, 0.5);
  assert(json.deposit_address?.startsWith("0x"));
});

Deno.test("paywatcher: rates returns multi-provider sheet", async () => {
  const { status, json } = await call({ action: "rates" });
  assertEquals(status, 200);
  assert(Array.isArray(json.rails));
  const pw = json.rails.find((r: any) => r.provider === "paywatcher");
  assert(pw, "paywatcher rail present");
  assertEquals(pw.charge - pw.cost, pw.margin_usdc);
});

Deno.test("paywatcher: OPTIONS preflight returns CORS", async () => {
  const r = await fetch(FN, { method: "OPTIONS" });
  await r.text();
  assertEquals(r.headers.get("access-control-allow-origin"), "*");
});

Deno.test("paywatcher: unknown action rejected", async () => {
  const { status, json } = await call({ action: "nope" });
  assertEquals(status, 400);
  assert(String(json.error).includes("unknown"));
});
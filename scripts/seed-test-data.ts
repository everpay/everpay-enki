/**
 * Seed realistic test data for the Enki admin via the admin-data-proxy.
 *
 * Usage:
 *   ADMIN_JWT="<jwt-from-logged-in-admin-session>" bun scripts/seed-test-data.ts
 *
 * Get the JWT: open the preview logged in as admin -> DevTools -> Application
 * -> Local Storage -> sb-* auth key -> currentSession.access_token.
 *
 * Seeds: 3 merchants, processors via psp_routes, baseline routing_rules.
 * Idempotent: skips rows already present (matched by name/processor).
 */
const PROXY_URL = "https://schxpniiwnxzscbcnynt.supabase.co/functions/v1/admin-data-proxy";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI";
const JWT = process.env.ADMIN_JWT;

if (!JWT) {
  console.error("Missing ADMIN_JWT env var. See header comment in this file.");
  process.exit(1);
}

async function call(body: Record<string, unknown>) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT}`,
      apikey: ANON,
    },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(`${body.action} ${body.table}: ${res.status} ${json?.error || JSON.stringify(json)}`);
  }
  return json;
}

async function ensure(table: string, match: Record<string, unknown>, insertData: Record<string, unknown>) {
  const { data } = await call({ action: "select", table, filters: match, limit: 1 });
  if (data?.length) {
    console.log(`= ${table} exists`, match);
    return data[0];
  }
  const created = await call({ action: "insert", table, data: insertData });
  console.log(`+ ${table} created`, match);
  return created.data;
}

const MERCHANTS = [
  { name: "QA Test Acme USD", currency: "USD", country: "US" },
  { name: "QA Test Eurokart EUR", currency: "EUR", country: "DE" },
  { name: "QA Test Bombay INR", currency: "INR", country: "IN" },
];
const PROCESSORS = ["shieldhub", "mondo", "paygate10", "makapay"];

(async () => {
  console.log("Seeding admin test data...\n");
  const merchants: any[] = [];
  for (const m of MERCHANTS) merchants.push(await ensure("merchants", { name: m.name }, m));

  for (const m of merchants) {
    if (!m?.id) continue;
    for (let i = 0; i < PROCESSORS.length; i++) {
      await ensure(
        "psp_routes",
        { merchant_id: m.id, processor: PROCESSORS[i] },
        { merchant_id: m.id, processor: PROCESSORS[i], priority: i, active: i === 0 }
      );
    }
    await ensure(
      "routing_rules",
      { merchant_id: m.id, name: "QA default rule" },
      { merchant_id: m.id, name: "QA default rule", priority: 100, target_provider: "shieldhub", active: true, currency_match: [] }
    );
  }
  console.log("\nSeed complete.");
})().catch((e) => { console.error("\nSeed failed:", e.message); process.exit(1); });

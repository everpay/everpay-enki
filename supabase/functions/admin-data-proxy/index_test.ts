import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * RLS / scoping tests for the `admin-data-proxy` edge function.
 *
 * These tests verify that the proxy:
 *   1. Rejects unauthenticated callers (401).
 *   2. Rejects authenticated non-admin callers (403) — i.e. a regular
 *      merchant user cannot use the proxy to read another merchant's rows.
 *   3. Rejects table names that are not on the allow-list (400).
 *   4. When an admin caller passes `filters.merchant_id`, every returned
 *      row is scoped to that merchant_id (no cross-merchant leakage).
 *
 * Required env (loaded from project root .env or shell):
 *   VITE_SUPABASE_URL                — Enki project URL (where proxy runs)
 *   VITE_SUPABASE_PUBLISHABLE_KEY    — Enki anon key
 *   TEST_ADMIN_JWT                   — JWT for an admin/super_admin user
 *   TEST_MERCHANT_JWT                — JWT for a regular non-admin user
 *   TEST_MERCHANT_ID                 — A merchant_id to scope-filter against
 *
 * If the JWTs are not provided, scope/role tests are skipped (only the
 * unauthenticated path is exercised) so the suite stays runnable in CI
 * without secrets.
 */

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const ADMIN_JWT = Deno.env.get("TEST_ADMIN_JWT") || "";
const MERCHANT_JWT = Deno.env.get("TEST_MERCHANT_JWT") || "";
const MERCHANT_ID = Deno.env.get("TEST_MERCHANT_ID") || "";

const FN_URL = `${SUPABASE_URL}/functions/v1/admin-data-proxy`;

async function callProxy(body: Record<string, unknown>, jwt?: string) {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json, text };
}

Deno.test("admin-data-proxy rejects unauthenticated callers with 401", async () => {
  const { status, json } = await callProxy({
    action: "select",
    table: "merchants",
    limit: 1,
  });
  assertEquals(status, 401);
  assertExists(json?.error);
});

Deno.test("admin-data-proxy rejects calls without an action (400)", async () => {
  if (!ADMIN_JWT) {
    console.warn("[skip] TEST_ADMIN_JWT not set");
    return;
  }
  const { status, json } = await callProxy({}, ADMIN_JWT);
  assertEquals(status, 400);
  assertExists(json?.error);
});

Deno.test("admin-data-proxy rejects non-admin authenticated callers with 403", async () => {
  if (!MERCHANT_JWT) {
    console.warn("[skip] TEST_MERCHANT_JWT not set");
    return;
  }
  const { status, json } = await callProxy(
    { action: "select", table: "merchants", limit: 1 },
    MERCHANT_JWT,
  );
  assertEquals(status, 403, `expected 403 got ${status} body=${JSON.stringify(json)}`);
});

Deno.test("admin-data-proxy blocks tables not on the allow-list (400)", async () => {
  if (!ADMIN_JWT) {
    console.warn("[skip] TEST_ADMIN_JWT not set");
    return;
  }
  const { status, json } = await callProxy(
    { action: "select", table: "auth.users", limit: 1 },
    ADMIN_JWT,
  );
  assertEquals(status, 400);
  assert(String(json?.error || "").toLowerCase().includes("disallowed"));
});

/**
 * Core scoping check: when an admin passes filters.merchant_id, every row
 * returned for a merchant-scoped table must match that merchant_id. This
 * guards against a regression where the proxy drops or ignores the filter
 * and accidentally returns cross-merchant data.
 */
const SCOPED_TABLES = [
  "transactions",
  "customers",
  "disputes",
  "payment_methods",
  "subscriptions",
  "invoices",
  "refunds",
  "crypto_wallets",
  "crypto_commissions",
  "surcharge_settings",
  "payouts",
];

for (const table of SCOPED_TABLES) {
  Deno.test(`admin-data-proxy scopes ${table} rows to filters.merchant_id`, async () => {
    if (!ADMIN_JWT || !MERCHANT_ID) {
      console.warn(`[skip] need TEST_ADMIN_JWT and TEST_MERCHANT_ID for ${table}`);
      return;
    }
    const { status, json } = await callProxy(
      {
        action: "select",
        table,
        filters: { merchant_id: MERCHANT_ID },
        limit: 50,
      },
      ADMIN_JWT,
    );
    // 200 with data array (possibly empty) is the only acceptable success shape.
    assertEquals(status, 200, `unexpected status for ${table}: ${status} ${JSON.stringify(json)}`);
    const rows: any[] = json?.data ?? [];
    assert(Array.isArray(rows), `${table}: data must be an array`);
    for (const row of rows) {
      // Every row in a merchant-scoped table MUST carry the requested merchant_id.
      assertEquals(
        row.merchant_id,
        MERCHANT_ID,
        `${table}: row leaked from another merchant (got ${row.merchant_id})`,
      );
    }
  });
}

/**
 * Negative scoping check: requesting a different (random) merchant_id must
 * not surface rows belonging to MERCHANT_ID.
 */
Deno.test("admin-data-proxy filter for a foreign merchant_id never returns MERCHANT_ID rows", async () => {
  if (!ADMIN_JWT || !MERCHANT_ID) {
    console.warn("[skip] need TEST_ADMIN_JWT and TEST_MERCHANT_ID");
    return;
  }
  const fakeMerchant = "00000000-0000-0000-0000-000000000000";
  const { status, json } = await callProxy(
    {
      action: "select",
      table: "transactions",
      filters: { merchant_id: fakeMerchant },
      limit: 50,
    },
    ADMIN_JWT,
  );
  assertEquals(status, 200);
  const rows: any[] = json?.data ?? [];
  for (const row of rows) {
    assert(
      row.merchant_id !== MERCHANT_ID,
      `cross-merchant leak: got MERCHANT_ID row when filtering for ${fakeMerchant}`,
    );
    assertEquals(row.merchant_id, fakeMerchant);
  }
});

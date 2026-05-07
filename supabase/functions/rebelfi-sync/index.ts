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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!REBELFI_API_KEY) {
      return new Response(JSON.stringify({ error: "REBELFI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roleRows || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    let merchantId: string | undefined = body.merchant_id;
    if (!merchantId) {
      const { data: m } = await admin.from("merchants").select("id").eq("user_id", userData.user.id).maybeSingle();
      merchantId = m?.id;
    }
    if (!merchantId) {
      return new Response(JSON.stringify({ error: "No merchant found for user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const opsR = await rfFetch(`/operations?limit=100`);
    const operations: any[] = (opsR.body?.operations || opsR.body?.data || opsR.body || []) as any[];

    let inserted = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const op of Array.isArray(operations) ? operations : []) {
      const opId = op.id || op.operation_id || op.uuid;
      if (!opId) { skipped++; continue; }
      const type = (op.type || op.operation_type || "").toString().toLowerCase();
      const isCredit = ["yield","interest","earnings","allocation_yield","reward","deposit"].some((t) => type.includes(t));
      const amountUnits = toUnits(op.amount ?? op.value ?? op.netAmount ?? 0);
      if (!isCredit || amountUnits <= 0) { skipped++; continue; }

      const currency = (op.currency || op.asset || "USDC").toString().toUpperCase();
      const ledgerCurrency = currency === "USDC" || currency === "USDT" ? "USD" : currency;
      const idemKey = `rebelfi:${opId}`;

      const { data: existing } = await admin.from("transactions").select("id").eq("idempotency_key", idemKey).maybeSingle();
      if (existing) { skipped++; continue; }

      const { data: tx, error: txErr } = await admin.from("transactions").insert({
        merchant_id: merchantId,
        amount: amountUnits,
        currency: ledgerCurrency,
        status: "completed",
        provider: "rebelfi",
        provider_ref: opId,
        description: `RebelFi ${type || "yield"} - ${op.venueId || op.venue || ""}`,
        idempotency_key: idemKey,
        metadata: { rebelfi: op },
      }).select("id").single();
      if (txErr || !tx) { errors.push({ opId, error: txErr?.message }); continue; }

      let { data: acct } = await admin.from("accounts").select("id")
        .eq("merchant_id", merchantId).eq("currency", ledgerCurrency).maybeSingle();
      if (!acct) {
        const { data: newAcct, error: acctErr } = await admin.from("accounts").insert({
          merchant_id: merchantId, currency: ledgerCurrency,
          balance: 0, pending_balance: 0, available_balance: 0,
        }).select("id").single();
        if (acctErr || !newAcct) { errors.push({ opId, error: acctErr?.message || "account create failed" }); continue; }
        acct = newAcct;
      }

      const { error: leErr } = await admin.from("ledger_entries").insert([
        { transaction_id: tx.id, account_id: acct.id, entry_type: "credit", amount: amountUnits, currency: ledgerCurrency },
      ]);
      if (leErr) { errors.push({ opId, error: leErr.message }); continue; }

      const { data: cur } = await admin.from("accounts").select("balance, available_balance").eq("id", acct.id).single();
      await admin.from("accounts").update({
        balance: Number(cur?.balance || 0) + amountUnits,
        available_balance: Number(cur?.available_balance || 0) + amountUnits,
        updated_at: new Date().toISOString(),
      }).eq("id", acct.id);

      inserted++;
    }

    return new Response(JSON.stringify({
      ok: true, merchant_id: merchantId, scanned: operations.length, inserted, skipped, errors,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

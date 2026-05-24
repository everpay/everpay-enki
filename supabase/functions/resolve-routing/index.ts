// Server-side authoritative routing resolver. Mirrors process-payment routing
// so the client can validate the displayed "Matched rule" matches what
// process-payment will actually use.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RuleRow {
  id: string;
  name: string | null;
  priority: number;
  active: boolean;
  currency_match: string[] | null;
  amount_min: number | null;
  amount_max: number | null;
  target_provider: string | null;
  fallback_provider: string | null;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const currency = (body.currency || "").toUpperCase();
  if (!currency) return json({ error: "currency is required" }, 400);
  const amount = typeof body.amount === "number" && isFinite(body.amount) ? body.amount : null;
  const paymentMethod = body.paymentMethod || "card";
  const country = (body.country || body.consumerCountry || "").toUpperCase();

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  let merchantId: string | null = body.merchantId || null;
  let gamblingEnabled = false;

  if (!merchantId) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: u } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      if (u?.user) {
        const { data: m } = await admin
          .from("merchants").select("id, gambling_enabled").eq("user_id", u.user.id).maybeSingle();
        if (m) { merchantId = m.id; gamblingEnabled = !!m.gambling_enabled; }
      }
    }
  }

  if (merchantId && !gamblingEnabled) {
    const { data: m } = await admin
      .from("merchants").select("gambling_enabled").eq("id", merchantId).maybeSingle();
    gamblingEnabled = !!m?.gambling_enabled;
  }

  let rules: RuleRow[] = [];
  if (merchantId) {
    const { data } = await admin.from("routing_rules")
      .select("id, name, priority, active, currency_match, amount_min, amount_max, target_provider, fallback_provider")
      .eq("merchant_id", merchantId).eq("active", true).order("priority", { ascending: true });
    rules = (data ?? []) as RuleRow[];
  }

  let matched: RuleRow | null = null;
  for (const r of rules) {
    if (r.active === false) continue;
    const cs = (r.currency_match ?? []).map((c) => c.toUpperCase());
    if (cs.length > 0 && !cs.includes(currency)) continue;
    if (amount != null) {
      if (r.amount_min != null && amount < Number(r.amount_min)) continue;
      if (r.amount_max != null && amount > Number(r.amount_max)) continue;
    }
    matched = r;
    break;
  }

  let provider: string;
  let reason: string;
  if (matched && matched.target_provider) {
    provider = matched.target_provider;
    reason = "override_rule";
  } else if (paymentMethod === "interac" || paymentMethod === "interac_etransfer") {
    if (country !== "CA" || currency !== "CAD") {
      return json({ error: "Interac e-Transfer is only available for Canadian consumers (country=CA, currency=CAD)", code: "INTERAC_REGION_RESTRICTED" }, 400);
    }
    provider = "dcbank";
    reason = "interac_canada";
  } else if (country === "CA" && currency === "CAD" && (paymentMethod === "auto" || paymentMethod === "bank")) {
    provider = "dcbank";
    reason = "ca_default_interac";
  } else if (paymentMethod === "open_banking") {
    provider = "mondo";
    reason = "open_banking";
  } else if (gamblingEnabled) {
    provider = "matrix";
    reason = "gambling_enabled";
  } else {
    provider = "shieldhub";
    reason = "default_policy";
  }

  return json({
    provider, reason,
    matched_rule_id: matched?.id ?? null,
    matched_rule: matched ?? null,
    inputs: { currency, amount, paymentMethod, country, merchantId, gamblingEnabled },
    rules_evaluated: rules.length,
  });
});
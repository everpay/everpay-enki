// OFAPay edge function — merchant-scoped actions.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofaPost, OFA_PATHS } from "../_shared/ofapay.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPA_URL, SRK);
    const { data: merchant } = await admin.from("merchants").select("id").eq("user_id", u.user.id).maybeSingle();
    if (!merchant) return json({ error: "No merchant for user" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "services") {
      const { data } = await admin.from("ofapay_service_codes")
        .select("service_name,paytype,internal_ref,currency,active").eq("active", true).order("currency");
      return json({ services: data ?? [] });
    }

    const svcName = String(body.service_name || "");
    const { data: svc } = await admin.from("ofapay_service_codes").select("*").eq("service_name", svcName).eq("active", true).maybeSingle();
    if (!svc) return json({ error: `Unknown service_name '${svcName}'` }, 400);

    const SUPA_PROJECT_URL = SUPA_URL.replace(/\/+$/, "");
    const noticeurl = `${SUPA_PROJECT_URL}/functions/v1/ofapay-callback?kind=${action === "withdrawal" ? "withdrawal" : "deposit"}`;

    if (action === "deposit") {
      const orderid = String(body.orderid || `EP-${Date.now()}-${crypto.randomUUID().slice(0,8)}`);
      const payload: Record<string, unknown> = {
        scode: svc.scode, orderid, paytype: svc.paytype,
        amount: String(body.amount ?? ""), productname: String(body.productname || "Payment"),
        currency: svc.currency, userid: String(body.userid || merchant.id),
        memo: String(body.memo || ""), redirectpage: "0", noticeurl,
      };
      const { status, body: resp } = await ofaPost(OFA_PATHS.deposit, payload, svc.signing_key);
      await admin.from("ofapay_transactions").upsert({
        merchant_id: merchant.id, service_name: svc.service_name, kind: "deposit",
        orderid, orderno: resp?.orderno ?? null,
        amount: Number(payload.amount) || 0, currency: svc.currency,
        status: resp?.respcode === "00" ? "processing" : "failure",
        respcode: resp?.respcode ?? null, respmsg: resp?.respmsg ?? resp?.msg ?? null,
        request_payload: payload, response_payload: resp,
      }, { onConflict: "merchant_id,orderid" });
      return json({ ok: status === 200 && resp?.respcode === "00", orderid, provider: resp });
    }

    if (action === "withdrawal") {
      const orderid = String(body.orderid || `WD-${Date.now()}-${crypto.randomUUID().slice(0,8)}`);
      const payload: Record<string, unknown> = {
        scode: svc.scode, orderid, paytype: svc.paytype,
        amount: String(body.amount ?? ""), currency: svc.currency,
        bankno: String(body.bankno || ""), accountno: String(body.accountno || ""), accountname: String(body.accountname || ""),
        notifyurl: noticeurl, memo: String(body.memo || ""), userid: String(body.userid || merchant.id),
      };
      const { status, body: resp } = await ofaPost(OFA_PATHS.withdrawal, payload, svc.signing_key);
      await admin.from("ofapay_transactions").upsert({
        merchant_id: merchant.id, service_name: svc.service_name, kind: "withdrawal",
        orderid, orderno: resp?.orderno ?? null,
        amount: Number(payload.amount) || 0, currency: svc.currency,
        status: resp?.respcode === "00" ? "processing" : "failure",
        respcode: resp?.respcode ?? null, respmsg: resp?.respmsg ?? resp?.msg ?? null,
        request_payload: payload, response_payload: resp,
      }, { onConflict: "merchant_id,orderid" });
      return json({ ok: status === 200 && resp?.respcode === "00", orderid, provider: resp });
    }

    if (action === "query") {
      const orderid = String(body.orderid || "");
      if (!orderid) return json({ error: "orderid required" }, 400);
      const kind = body.kind === "withdrawal" ? "withdrawal" : "deposit";
      const path = kind === "withdrawal" ? OFA_PATHS.withdrawalEnquiry : OFA_PATHS.depositEnquiry;
      const { body: resp } = await ofaPost(path, { scode: svc.scode, orderid }, svc.signing_key);
      return json({ provider: resp });
    }

    if (action === "balance") {
      const { body: resp } = await ofaPost(OFA_PATHS.balance, { scode: svc.scode }, svc.signing_key);
      return json({ provider: resp });
    }

    return json({ error: `Unknown action '${action}'` }, 400);
  } catch (e) {
    console.error("ofapay error", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
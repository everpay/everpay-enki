// Public webhook receiver for OFAPay notifications (deposit + withdrawal).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofaVerify } from "../_shared/ofapay.ts";

const text = (s: string, code = 200) =>
  new Response(s, { status: code, headers: { "Content-Type": "text/plain" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return text("method", 405);
  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") === "withdrawal" ? "withdrawal" : "deposit";
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") return text("bad", 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const scode = String((payload as any).scode || "");
    const { data: svc } = await admin.from("ofapay_service_codes").select("service_name,signing_key").eq("scode", scode).maybeSingle();
    if (!svc) return text("bad", 400);
    const ok = await ofaVerify(payload as Record<string, unknown>, svc.signing_key);
    if (!ok) return text("bad", 400);
    const p = payload as Record<string, any>;
    const finalStatus = kind === "deposit"
      ? (p.status === "1" ? "success" : p.status === "-1" ? "failure" : "processing")
      : (p.status === "S" ? "success" : p.status === "F" ? "failure" : "processing");
    await admin.from("ofapay_transactions").update({
      status: finalStatus, orderno: p.orderno ?? null, respcode: p.respcode ?? null,
      respmsg: p.msg ?? p.respmsg ?? null, txid: p.txid ?? null,
      credit_amount: p.credit_amount != null ? Number(p.credit_amount) : null, last_callback: p,
    }).eq("orderid", p.orderid).eq("kind", kind);
    return text("success");
  } catch (e) {
    console.error("ofapay-callback error", e);
    return text("error", 500);
  }
});
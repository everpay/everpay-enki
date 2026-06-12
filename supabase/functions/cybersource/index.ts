// Visa / Cybersource REST API v2 merchant-facing edge function.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_HOST = "apitest.cybersource.com";

function getEnv() {
  const merchantId = Deno.env.get("CYBERSOURCE_MERCHANT_ID");
  const keyId = Deno.env.get("CYBERSOURCE_API_KEY_ID");
  const secret = Deno.env.get("CYBERSOURCE_SECRET_KEY");
  const host = (Deno.env.get("CYBERSOURCE_BASE_URL") ?? DEFAULT_HOST).replace(/^https?:\/\//, "").replace(/\/$/, "");
  return { merchantId, keyId, secret, host };
}

async function sha256Base64(body: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function hmacSha256Base64(secretBase64: string, msg: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function buildHeaders(method: "GET" | "POST" | "PATCH" | "DELETE", resourcePath: string, body: string) {
  const { merchantId, keyId, secret, host } = getEnv();
  if (!merchantId || !keyId || !secret) {
    throw new Error("Cybersource credentials missing: set CYBERSOURCE_MERCHANT_ID, CYBERSOURCE_API_KEY_ID, CYBERSOURCE_SECRET_KEY.");
  }
  const date = new Date().toUTCString();
  const digest = method === "GET" ? "" : `SHA-256=${await sha256Base64(body)}`;
  const headersToSign = method === "GET"
    ? ["host", "date", "(request-target)", "v-c-merchant-id"]
    : ["host", "date", "(request-target)", "digest", "v-c-merchant-id"];
  const signingString = headersToSign.map((h) => {
    if (h === "host") return `host: ${host}`;
    if (h === "date") return `date: ${date}`;
    if (h === "(request-target)") return `(request-target): ${method.toLowerCase()} ${resourcePath}`;
    if (h === "digest") return `digest: ${digest}`;
    if (h === "v-c-merchant-id") return `v-c-merchant-id: ${merchantId}`;
    return "";
  }).join("\n");
  const signature = await hmacSha256Base64(secret, signingString);
  const sigHeader = `keyid="${keyId}", algorithm="HmacSHA256", headers="${headersToSign.join(" ")}", signature="${signature}"`;
  const out: Record<string, string> = {
    Host: host, Date: date, "v-c-merchant-id": merchantId, Signature: sigHeader, "Content-Type": "application/json",
  };
  if (digest) out.Digest = digest;
  return { headers: out, host };
}

async function csRequest(method: "GET" | "POST" | "PATCH" | "DELETE", resourcePath: string, payload?: unknown) {
  const body = payload ? JSON.stringify(payload) : "";
  const { headers, host } = await buildHeaders(method, resourcePath, body);
  const res = await fetch(`https://${host}${resourcePath}`, { method, headers, body: method === "GET" ? undefined : body });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    let merchantId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        const { data } = await supabase.from("merchants").select("id").eq("user_id", user.id).single();
        merchantId = data?.id ?? null;
      }
    }

    const { action, ...p } = await req.json();
    const idemKey: string | null = p.idempotency_key ?? null;
    if (merchantId && idemKey) {
      const { data: prior } = await supabase.from("idempotency_keys").select("response").eq("merchant_id", merchantId).eq("key", idemKey).maybeSingle();
      if (prior?.response) {
        return new Response(JSON.stringify({ ...(prior.response as any), _idempotent_replay: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let response: any;
    switch (action) {
      case "deposit": {
        const payload = {
          clientReferenceInformation: { code: p.reference ?? crypto.randomUUID() },
          processingInformation: { capture: p.capture !== false },
          paymentInformation: {
            card: {
              number: p.card?.number,
              expirationMonth: String(p.card?.exp_month ?? "").padStart(2, "0"),
              expirationYear: String(p.card?.exp_year ?? ""),
              securityCode: p.card?.cvv,
              type: p.card?.type,
            },
          },
          orderInformation: {
            amountDetails: { totalAmount: String(p.amount), currency: p.currency },
            billTo: p.customer ? {
              firstName: p.customer.first_name, lastName: p.customer.last_name,
              email: p.customer.email, country: p.customer.country,
            } : undefined,
          },
        };
        response = await csRequest("POST", "/pts/v2/payments", payload);
        break;
      }
      case "capture":
        response = await csRequest("POST", `/pts/v2/payments/${p.id}/captures`, {
          clientReferenceInformation: { code: p.reference ?? crypto.randomUUID() },
          orderInformation: { amountDetails: { totalAmount: String(p.amount), currency: p.currency } },
        }); break;
      case "refund":
        response = await csRequest("POST", `/pts/v2/payments/${p.id}/refunds`, {
          clientReferenceInformation: { code: p.reference ?? crypto.randomUUID() },
          orderInformation: { amountDetails: { totalAmount: String(p.amount), currency: p.currency } },
        }); break;
      case "void":
        response = await csRequest("POST", `/pts/v2/payments/${p.id}/voids`, {
          clientReferenceInformation: { code: p.reference ?? crypto.randomUUID() },
        }); break;
      case "query":
        response = await csRequest("GET", `/tss/v2/transactions/${p.provider_ref ?? p.id}`); break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (merchantId && idemKey) {
      await supabase.from("idempotency_keys").upsert(
        { merchant_id: merchantId, key: idemKey, response: response.body },
        { onConflict: "merchant_id,key" },
      );
    }

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cybersource error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
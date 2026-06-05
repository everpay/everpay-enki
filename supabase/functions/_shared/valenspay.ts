// ValensPay PG6 V3.2 client. Ported from Everpay Platform OS.
const BASE = (Deno.env.get("VALENSPAY_BASE_URL") || "https://valenspayapi-uat.valenspay.com").replace(/\/+$/, "");
const VER = (Deno.env.get("VALENSPAY_API_VERSION") || "v3.2").toLowerCase();

function getCreds() {
  const clientKey = Deno.env.get("VALENSPAY_CLIENT_KEY") || Deno.env.get("VALENSPAY_CLIENT_ID");
  const secret = Deno.env.get("VALENSPAY_SECRET_KEY") || Deno.env.get("VALENSPAY_SECRET");
  if (!clientKey || !secret) throw new Error("VALENSPAY_CLIENT_KEY / VALENSPAY_SECRET_KEY not configured");
  return { clientKey, secret };
}

function toHex(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}

async function hmacSha1Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

function resolvePath(path: string): { url: string; signingPath: string } {
  if (path.startsWith("http")) {
    const u = new URL(path);
    return { url: path, signingPath: u.pathname + (u.search || "") };
  }
  const rel = path.startsWith("/") ? path : `/${path}`;
  const signingPath = rel.startsWith("/api/") ? rel : `/api/${VER}${rel}`;
  return { url: `${BASE}${signingPath}`, signingPath };
}

export async function valensFetch(path: string, init: RequestInit = {}) {
  const { clientKey, secret } = getCreds();
  const method = (init.method || "GET").toUpperCase();
  const { url, signingPath } = resolvePath(path);
  const rawBody = init.body == null || method === "GET" ? "" : (typeof init.body === "string" ? init.body : JSON.stringify(init.body));
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${method}${timestamp}${signingPath}${rawBody}`;
  const signature = await hmacSha1Hex(secret, payload);
  const res = await fetch(url, {
    ...init,
    method,
    body: method === "GET" ? undefined : rawBody,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "V-CLIENT-KEY": clientKey,
      "timestamp": timestamp,
      "signature": signature,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { _raw: text }; }
  return { res, data };
}
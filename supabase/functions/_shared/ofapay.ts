// OFAPay shared helpers — signing, fetch, types.
import { crypto as stdCrypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

export const OFA_BASE_URL = Deno.env.get("OFA_BASE_URL") || "https://www.jzc899.com";

export async function ofaSign(payload: Record<string, unknown>, signingKey: string): Promise<string> {
  const entries = Object.entries(payload)
    .filter(([k]) => k !== "sign")
    .map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const raw = entries.map(([k, v]) => `${k}=${v}`).join("&") + `&key=${signingKey}`;
  const buf = await stdCrypto.subtle.digest("MD5", new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function ofaVerify(payload: Record<string, unknown>, signingKey: string): Promise<boolean> {
  const provided = String(payload?.sign ?? "").toLowerCase();
  if (!provided) return false;
  return (await ofaSign(payload, signingKey)).toLowerCase() === provided;
}

export async function ofaPost(path: string, payload: Record<string, unknown>, signingKey: string) {
  const signed = { ...payload, sign: await ofaSign(payload, signingKey) };
  const url = `${OFA_BASE_URL.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(signed),
  });
  const raw = await res.text();
  let body: any = raw;
  try { body = JSON.parse(raw); } catch { /* keep text */ }
  return { status: res.status, body, raw };
}

export const OFA_PATHS = {
  deposit: "/pay/order.aspx",
  depositEnquiry: "/pay/queryorder.aspx",
  uploadTxid: "/pay/uploadtxid.aspx",
  withdrawal: "/betdf/payout.aspx",
  withdrawalEnquiry: "/betdf/querypayout.aspx",
  balance: "/betdf/querybalance.aspx",
} as const;
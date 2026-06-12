// CaresPay API v1.8.1 shared client.
// Supports 2D (legacy/2-to-3D random) and dedicated 3D channels via separate MerNo/keys.
// Wire format: application/x-www-form-urlencoded over HTTPS, UTF-8.
import { createHash } from "node:crypto";

export type CarespayChannel = "2d" | "3d";
const DEFAULT_BASE = "https://testurl.carespay.com:28081";

export function carespayBase(): string {
  return (Deno.env.get("CARESPAY_BASE_URL") || DEFAULT_BASE).replace(/\/+$/, "");
}

export function carespayCreds(channel: CarespayChannel = "2d") {
  const merNo = channel === "3d" ? Deno.env.get("CARESPAY_3DS_MER_NO") : Deno.env.get("CARESPAY_MER_NO");
  const key = channel === "3d" ? Deno.env.get("CARESPAY_3DS_MD5_KEY") : Deno.env.get("CARESPAY_MD5_KEY");
  if (!merNo || !key) throw new Error(`Carespay ${channel.toUpperCase()} credentials not configured`);
  return { merNo, key, channel };
}

export function signPay(p: { merNo: string; billNo: string; currency: string; amount: string; returnURL: string; key: string }): string {
  return createHash("md5").update(`${p.merNo}${p.billNo}${p.currency}${p.amount}${p.returnURL}${p.key}`, "utf8").digest("hex");
}

export function signQuery(merNo: string, billNo: string, key: string): string {
  return createHash("md5").update(`merNo=${merNo}&billNo=${billNo}&key=${key}`, "utf8").digest("hex");
}

export async function carespayForm(path: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields).toString();
  const res = await fetch(`${carespayBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "Accept": "application/json" },
    body,
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { _raw: text }; }
  return { status: res.status, data };
}
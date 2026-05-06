// Thin client for the Everpay platform-admin-gateway.
// All privileged calls into the merchant project go through this.

const GATEWAY_URL = Deno.env.get("EVERPAY_OS_GATEWAY_URL")!;
const ADMIN_TOKEN = Deno.env.get("PLATFORM_OS_ADMIN_TOKEN")!;

export async function gw<T = any>(
  op: string,
  params: Record<string, unknown> = {},
  actor = "platform-os-admin",
): Promise<T> {
  if (!GATEWAY_URL || !ADMIN_TOKEN) {
    throw new Error("gateway_not_configured");
  }
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
      "x-platform-os-version": "1.0.0",
    },
    body: JSON.stringify({ op, params, actor }),
  });
  const text = await res.text();
  let body: any;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) {
    throw new Error(`gateway:${op} ${res.status} ${body?.error ?? body?.message ?? text}`);
  }
  return body as T;
}
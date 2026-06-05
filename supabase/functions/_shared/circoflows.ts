// Circoflows payment gateway client with multi-account (MID) support.
// Ported from Everpay Platform OS.
export type CircoflowsAccount = '2d' | 'peptides' | 'vip' | 'ftd';

interface AccountCreds {
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
}

const BASE = (Deno.env.get('CIRCOFLOWS_BASE_URL') || 'https://gateway.circoflows.com').replace(/\/+$/, '');
const ENV = (Deno.env.get('CIRCOFLOWS_ENVIRONMENT') || 'test').toLowerCase();

function envFor(account: CircoflowsAccount, suffix: string): string | undefined {
  const key = `CIRCOFLOWS_${account.toUpperCase()}_${suffix}`;
  return Deno.env.get(key) || undefined;
}

export function resolveAccount(account: string | undefined | null): CircoflowsAccount {
  const a = (account || '2d').toLowerCase();
  if (a === '2d' || a === 'peptides' || a === 'vip' || a === 'ftd') return a;
  return '2d';
}

export function getCircoflowsCreds(account: CircoflowsAccount): AccountCreds {
  return {
    apiKey: envFor(account, 'API_KEY') ?? '',
    apiSecret: envFor(account, 'API_SECRET') ?? '',
    webhookSecret: envFor(account, 'WEBHOOK_SECRET') ?? '',
  };
}

export function circoflowsPath(action: 'payment/create' | 'payment/status'): string {
  return ENV === 'live' ? `/api/v1/${action}` : `/api/v1/test/${action}`;
}

export async function circoflowsFetch(
  action: 'payment/create' | 'payment/status',
  body: unknown,
  account: CircoflowsAccount = '2d',
) {
  const creds = getCircoflowsCreds(account);
  if (!creds.apiKey) throw new Error(`Circoflows account "${account}" missing api key`);
  const url = `${BASE}${circoflowsPath(action)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.apiKey}`,
      'X-Api-Secret': creds.apiSecret,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { _raw: text }; }
  return { res, data };
}

export async function verifyCircoflowsSignature(
  account: CircoflowsAccount,
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;
  const { webhookSecret } = getCircoflowsCreds(account);
  if (!webhookSecret) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const a = hex.toLowerCase();
  const b = signature.replace(/^sha256=/, '').toLowerCase();
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
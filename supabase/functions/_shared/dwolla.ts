// Dwolla OAuth client_credentials helper.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const DWOLLA_ENV = (Deno.env.get('DWOLLA_ENVIRONMENT') || 'sandbox').toLowerCase();
export const DWOLLA_BASE = DWOLLA_ENV === 'production' ? 'https://api.dwolla.com' : 'https://api-sandbox.dwolla.com';
export const DWOLLA_AUTH_URL = `${DWOLLA_BASE}/token`;

export async function getDwollaToken(): Promise<string> {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: cached } = await admin.from('provider_tokens').select('*').eq('provider', 'dwolla').maybeSingle();
  if (cached && new Date(cached.expires_at).getTime() - Date.now() > 60_000) return cached.access_token;

  const key = Deno.env.get('DWOLLA_KEY')!;
  const secret = Deno.env.get('DWOLLA_SECRET')!;
  const basic = btoa(`${key}:${secret}`);
  const res = await fetch(DWOLLA_AUTH_URL, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: 'grant_type=client_credentials',
  });
  const tok = await res.json();
  if (!res.ok) throw new Error(`Dwolla auth failed [${res.status}]: ${JSON.stringify(tok)}`);
  const expiresAt = new Date(Date.now() + (Number(tok.expires_in || 3600) * 1000)).toISOString();
  await admin.from('provider_tokens').upsert({ provider: 'dwolla', access_token: tok.access_token, expires_at: expiresAt, updated_at: new Date().toISOString() });
  return tok.access_token as string;
}

export async function dwollaFetch(path: string, init: RequestInit = {}) {
  const token = await getDwollaToken();
  const url = path.startsWith('http') ? path : `${DWOLLA_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Accept': 'application/vnd.dwolla.v1.hal+json',
      'Content-Type': 'application/vnd.dwolla.v1.hal+json',
      'Authorization': `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { _raw: text }; }
  return { res, data, location: res.headers.get('Location') };
}
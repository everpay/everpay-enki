// Delos Financial — USD/EUR banking proxy.
// Endpoints assumed; adjust BASE_URL / paths once provider docs are confirmed.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const KEY = Deno.env.get('DELOS_API_KEY');
    if (!KEY) {
      return new Response(
        JSON.stringify({ ok: false, configured: false, balances: [], warning: 'delos_credentials_missing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    // Default to the BaaS host shipped in the official Delos OpenAPI/Postman
    // collection. Override with DELOS_BASE_URL secret for production tenants.
    const BASE = Deno.env.get('DELOS_BASE_URL') || 'https://tp1.tst-apidmndelss.com/v2';
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const headers = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

    const safeJson = async (res: Response) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json().catch(() => ({}));
      const text = await res.text().catch(() => '');
      return { non_json_upstream: true, status: res.status, body_preview: text.slice(0, 200) };
    };

    if (action === 'ping') {
      const res = await fetch(`${BASE}/account`, { headers });
      await res.text().catch(() => '');
      return new Response(JSON.stringify({ ok: res.ok, status: res.status, base: BASE }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'balances' || action === 'list_accounts') {
      // Per the Delos BaaS OpenAPI v2 collection: GET /v2/account
      const res = await fetch(`${BASE}/account`, { headers });
      const data = await safeJson(res);
      const items = Array.isArray(data) ? data : (data.items || data.accounts || []);
      const balances = items.map((a: any) => ({
        account_id: a.id || a.accountId,
        currency: a.currency || a.currencyCode || 'USD',
        balance: a.balance?.available ?? a.available ?? a.balance ?? 0,
        available: a.balance?.available ?? a.available ?? 0,
      }));
      return new Response(JSON.stringify({ balances, raw: data, ok: res.ok }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'balance') {
      const res = await fetch(`${BASE}/account/${body.accountId}`, { headers });
      const data = await safeJson(res);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'payout') {
      // Per Delos OpenAPI v2: POST /v2/billing/operation creates a payment/transfer.
      const res = await fetch(`${BASE}/billing/operation`, { method: 'POST', headers, body: JSON.stringify(body.payload || {}) });
      const data = await safeJson(res);
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Delos payout failed [${res.status}]`, detail: data }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Idempotent ledger write
      try {
        const { recordProviderLedger } = await import('../_shared/ledger.ts');
        const supabase = (await import('https://esm.sh/@supabase/supabase-js@2.39.3')).createClient(
          Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        await recordProviderLedger(supabase, {
          merchantId: body.merchant_id,
          provider: 'delos',
          providerRef: String(data.id || data.operationId || crypto.randomUUID()),
          amount: Number(body.payload?.amount || 0),
          currency: (body.payload?.currency || 'USD').toUpperCase(),
          status: data.status || 'processing',
          type: 'payout',
          metadata: { upstream: data },
        });
      } catch (e) { console.warn('delos ledger write failed', e); }
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Delos error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
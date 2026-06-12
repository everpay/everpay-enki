import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { dwollaFetch, DWOLLA_BASE } from "../_shared/dwolla.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return j({ error: 'Unauthorized' }, 401);
    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await supabaseUser.auth.getUser();
    if (!u?.user) return j({ error: 'Unauthorized' }, 401);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: m } = await admin.from('merchants').select('id').eq('user_id', u.user.id).single();
    if (!m) return j({ error: 'Merchant not found' }, 404);

    if (req.method === 'GET') {
      const { data } = await admin.from('dwolla_transfers').select('*').eq('merchant_id', m.id).order('created_at', { ascending: false }).limit(50);
      return j({ transfers: data || [] });
    }

    const body = await req.json();
    const idempotencyKey: string = body.idempotency_key || crypto.randomUUID();
    const amount = Number(body.amount);
    const direction = body.direction === 'credit' ? 'credit' : 'debit';
    const fundingSourceId: string = body.funding_source_id;
    if (!fundingSourceId || !amount || amount <= 0) return j({ error: 'funding_source_id + positive amount required' }, 400);

    const { data: fs } = await admin.from('dwolla_funding_sources').select('*').eq('merchant_id', m.id).eq('dwolla_funding_source_id', fundingSourceId).maybeSingle();
    if (!fs) return j({ error: 'Funding source not found' }, 404);

    const { data: existing } = await admin.from('dwolla_transfers').select('*').eq('merchant_id', m.id).eq('idempotency_key', idempotencyKey).maybeSingle();
    if (existing) return j({ transfer: existing, reused: true });

    const masterFundingId = Deno.env.get('DWOLLA_MASTER_FUNDING_SOURCE_ID');
    const masterUrl = masterFundingId ? `${DWOLLA_BASE}/funding-sources/${masterFundingId}` : null;
    const merchantFsUrl = `${DWOLLA_BASE}/funding-sources/${fundingSourceId}`;
    const source = direction === 'debit' ? merchantFsUrl : masterUrl;
    const destination = direction === 'debit' ? masterUrl : merchantFsUrl;
    if (!source || !destination) return j({ error: 'Platform funding source not configured (DWOLLA_MASTER_FUNDING_SOURCE_ID)' }, 500);

    const payload = {
      _links: { source: { href: source }, destination: { href: destination } },
      amount: { currency: 'USD', value: amount.toFixed(2) },
      metadata: { merchant_id: m.id, idempotency_key: idempotencyKey, ...(body.metadata || {}) },
    };

    const { res, data, location } = await dwollaFetch('/transfers', {
      method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload),
    });
    const transferId = location?.split('/').pop() || null;
    const row = {
      merchant_id: m.id, dwolla_transfer_id: transferId, idempotency_key: idempotencyKey,
      source_url: source, destination_url: destination, amount, currency: 'USD', direction,
      status: res.ok ? 'pending' : 'failed', failure_reason: res.ok ? null : (data?.message || JSON.stringify(data)),
      metadata: payload.metadata as any,
    };
    const { data: inserted, error: insErr } = await admin.from('dwolla_transfers').insert(row).select().single();
    if (insErr && insErr.code === '23505') {
      const { data: dupe } = await admin.from('dwolla_transfers').select('*').eq('merchant_id', m.id).eq('idempotency_key', idempotencyKey).single();
      return j({ transfer: dupe, reused: true });
    }
    if (!res.ok) return j({ error: data?.message || 'Transfer failed', details: data, transfer: inserted }, res.status);
    return j({ transfer: inserted });
  } catch (e: any) {
    return j({ error: e?.message || 'Internal error' }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
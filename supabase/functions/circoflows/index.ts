// Circoflows edge function — multi-MID create/status. Ported from Everpay Platform OS.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { circoflowsFetch, resolveAccount } from "../_shared/circoflows.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);

    const { data: merchant } = await admin
      .from('merchants').select('id, circoflows_mid').eq('user_id', u.user.id).maybeSingle();
    if (!merchant) return json({ error: 'Merchant not found' }, 404);

    const { data: isSuper } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'super_admin' });

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const requestedAccount = body.account || url.searchParams.get('account');
    const account = isSuper ? resolveAccount(requestedAccount) : resolveAccount(merchant.circoflows_mid ?? undefined);
    const { account: _omit, ...cfBody } = body;

    if (action === 'create') {
      const { res, data } = await circoflowsFetch('payment/create', cfBody, account);
      if (data?.transaction_id) {
        await admin.from('transactions').insert({
          merchant_id: merchant.id,
          provider: 'circoflows',
          provider_ref: data.transaction_id,
          amount: Number(cfBody.amount || 0),
          currency: cfBody.currency || 'USD',
          status: data.status === 'success' ? 'completed' : data.status === 'processing' ? 'pending' : 'failed',
          metadata: {
            merchant_transaction_id: cfBody.merchant_transaction_id,
            three_ds_url: data['3ds_url'] || null,
            reason: data.reason,
            circoflows_account: account,
          },
        });
      }
      return json({ ...data, account }, res.status);
    }

    if (action === 'status') {
      const { res, data } = await circoflowsFetch('payment/status', cfBody, account);
      return json({ ...data, account }, res.status);
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (e: any) {
    console.error('circoflows error:', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
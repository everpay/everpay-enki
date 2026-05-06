// Plaid Transfer API — US-only ACH/RTP payouts.
// Docs: https://plaid.com/docs/transfer/
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function plaidEnv() {
  return Deno.env.get('PLAID_ENV') || 'sandbox';
}
function plaidBase() {
  const env = plaidEnv();
  if (env === 'production') return 'https://production.plaid.com';
  if (env === 'development') return 'https://development.plaid.com';
  return 'https://sandbox.plaid.com';
}
function plaidAuth() {
  const id = Deno.env.get('PLAID_CLIENT_ID');
  const secret = Deno.env.get('PLAID_SECRET');
  if (!id || !secret) throw new Error('PLAID_CLIENT_ID / PLAID_SECRET not configured');
  return { client_id: id, secret };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = plaidAuth();
    const BASE = plaidBase();
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const headers = { 'Content-Type': 'application/json' };
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (action === 'ping') {
      // Lightweight call to verify creds.
      const res = await fetch(`${BASE}/categories/get`, { method: 'POST', headers, body: JSON.stringify({}) });
      return new Response(JSON.stringify({ ok: true, env: plaidEnv(), status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 1: authorization (US-only validation)
    if (action === 'authorize') {
      const res = await fetch(`${BASE}/transfer/authorization/create`, {
        method: 'POST', headers,
        body: JSON.stringify({
          ...auth,
          access_token: body.access_token,
          account_id: body.account_id,
          type: body.type || 'credit',         // credit = payout to user
          network: body.network || 'ach',      // ach | rtp | wire
          amount: String(body.amount),
          ach_class: body.ach_class || 'ppd',
          user: body.user,                     // {legal_name,email,address?{country:'US'}}
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Plaid authorize failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: create transfer (after authorization approved)
    if (action === 'create') {
      const res = await fetch(`${BASE}/transfer/create`, {
        method: 'POST', headers,
        body: JSON.stringify({
          ...auth,
          access_token: body.access_token,
          account_id: body.account_id,
          authorization_id: body.authorization_id,
          description: body.description || 'Everpay payout',
          metadata: { merchant_id: body.merchant_id, recipient_id: body.recipient_id },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Plaid create failed [${res.status}]: ${JSON.stringify(data)}`);

      await supabase.from('audit_logs').insert({
        user_id: body.merchant_id || '00000000-0000-0000-0000-000000000000',
        action: 'plaid_transfer_create',
        entity_type: 'transfer',
        entity_id: data?.transfer?.id,
        metadata: { network: body.network, amount: body.amount },
      });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get') {
      const res = await fetch(`${BASE}/transfer/get`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...auth, transfer_id: body.transfer_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Plaid get failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'list') {
      const res = await fetch(`${BASE}/transfer/list`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...auth, count: body.count || 25, offset: body.offset || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Plaid list failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cancel') {
      const res = await fetch(`${BASE}/transfer/cancel`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...auth, transfer_id: body.transfer_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Plaid cancel failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Plaid transfer error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
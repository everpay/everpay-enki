import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const KEY = Deno.env.get('WALLETSUITE_API_KEY');
    if (!KEY) throw new Error('WALLETSUITE_API_KEY not configured');
    const BASE = Deno.env.get('WALLETSUITE_BASE_URL') || 'https://api.walletsuite.io';
    const body = await req.json();
    const { action } = body;
    const headers = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

    if (action === 'ping') {
      const res = await fetch(`${BASE}/wallets?limit=1`, { headers });
      return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'create') {
      const res = await fetch(`${BASE}/wallets`, { method: 'POST', headers, body: JSON.stringify({ user_id: body.userId, currency: body.currency || 'USD', label: body.label, metadata: { merchant_id: body.merchantId } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(`WalletSuite create failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'balance') {
      const res = await fetch(`${BASE}/wallets/${body.walletId}/balance`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`WalletSuite balance failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'transfer') {
      const res = await fetch(`${BASE}/transfers`, { method: 'POST', headers, body: JSON.stringify({ from_wallet_id: body.fromWalletId, to_wallet_id: body.toWalletId, amount: body.amount, currency: body.currency, reference: body.reference }) });
      const data = await res.json();
      if (!res.ok) throw new Error(`WalletSuite transfer failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'list') {
      const params = new URLSearchParams();
      if (body.merchantId) params.set('merchant_id', body.merchantId);
      const res = await fetch(`${BASE}/wallets?${params}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`WalletSuite list failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('WalletSuite error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
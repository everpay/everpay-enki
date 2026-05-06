import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const CIRCLE_API_KEY = Deno.env.get('CIRCLE_API_KEY');
    if (!CIRCLE_API_KEY) throw new Error('CIRCLE_API_KEY not configured');

    const CIRCLE_BASE_URL = 'https://api.circle.com/v1';
    const body = await req.json();
    const { action } = body;

    const headers = {
      'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      'Content-Type': 'application/json',
    };

    if (action === 'transfer') {
      const res = await fetch(`${CIRCLE_BASE_URL}/transfers`, {
        method: 'POST', headers,
        body: JSON.stringify({
          idempotencyKey: body.idempotencyKey || crypto.randomUUID(),
          source: { type: 'wallet', id: body.walletId },
          destination: { type: 'blockchain', address: body.address, chain: body.chain || 'ETH' },
          amount: { amount: body.amount.toString(), currency: body.currency || 'USD' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle transfer failed [${res.status}]: ${JSON.stringify(data)}`);

      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase.from('audit_logs').insert({
        user_id: body.merchantId || '00000000-0000-0000-0000-000000000000',
        action: 'circle_transfer', entity_type: 'transfer', entity_id: data.data?.id,
        metadata: { amount: body.amount, chain: body.chain, destination: body.address },
      });
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'payout') {
      const res = await fetch(`${CIRCLE_BASE_URL}/payouts`, {
        method: 'POST', headers,
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          source: { type: 'wallet', id: body.walletId },
          destination: { type: 'blockchain', address: body.address, chain: body.chain || 'ETH' },
          amount: { amount: body.amount.toString(), currency: 'USD' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle payout failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'balance') {
      const res = await fetch(`${CIRCLE_BASE_URL}/wallets/${body.walletId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle balance failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'status') {
      const res = await fetch(`${CIRCLE_BASE_URL}/transfers/${body.transferId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle status failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ping') {
      const res = await fetch(`${CIRCLE_BASE_URL}/configuration`, { headers });
      return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Circle error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
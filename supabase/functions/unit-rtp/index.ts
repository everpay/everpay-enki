import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const UNIT_API_KEY = Deno.env.get('UNIT_API_KEY');
    if (!UNIT_API_KEY) throw new Error('UNIT_API_KEY not configured');
    const UNIT_BASE_URL = Deno.env.get('UNIT_BASE_URL') || 'https://api.s.unit.sh';
    const body = await req.json();
    const { action } = body;
    const headers = {
      'Authorization': `Bearer ${UNIT_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
    };

    if (action === 'ping') {
      const res = await fetch(`${UNIT_BASE_URL}/accounts?page[limit]=1`, { headers });
      return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'payment') {
      const res = await fetch(`${UNIT_BASE_URL}/payments`, {
        method: 'POST', headers,
        body: JSON.stringify({
          data: {
            type: 'wirePayment',
            attributes: {
              amount: Math.round(body.amount * 100),
              direction: 'Credit',
              description: body.description || 'RTP Payment',
              counterparty: { routingNumber: body.routingNumber, accountNumber: body.accountNumber, name: body.counterpartyName },
              tags: { ...body.tags, merchant_id: body.merchantId },
            },
            relationships: { account: { data: { type: 'account', id: body.accountId } } },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Unit payment failed [${res.status}]: ${JSON.stringify(data)}`);
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase.from('audit_logs').insert({
        user_id: body.merchantId || '00000000-0000-0000-0000-000000000000',
        action: 'unit_rtp_payment', entity_type: 'payment', entity_id: data.data?.id,
        metadata: { amount: body.amount, rail: body.rail || 'RTP' },
      });
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'balance') {
      const res = await fetch(`${UNIT_BASE_URL}/accounts/${body.accountId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Unit balance failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'paymentStatus') {
      const res = await fetch(`${UNIT_BASE_URL}/payments/${body.paymentId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Unit payment status failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Unit error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
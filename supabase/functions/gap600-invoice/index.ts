import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const GAP600_API_KEY = Deno.env.get('GAP600_API_KEY');
    if (!GAP600_API_KEY) throw new Error('GAP600_API_KEY not configured');
    const GAP600_BASE_URL = 'https://api.gap600.com';
    const body = await req.json();
    const { action } = body;
    const headers = { 'Authorization': `Bearer ${GAP600_API_KEY}`, 'Content-Type': 'application/json' };

    if (action === 'create') {
      const callbackUrl = body.callbackUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/gap600-webhook`;
      const res = await fetch(`${GAP600_BASE_URL}/invoices`, {
        method: 'POST', headers,
        body: JSON.stringify({
          price: body.amount, currency: body.currency || 'USD',
          callback_url: callbackUrl,
          metadata: { merchant_id: body.merchantId, order_id: body.orderId, customer_email: body.customerEmail },
          description: body.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gap600 invoice failed [${res.status}]: ${JSON.stringify(data)}`);
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase.from('audit_logs').insert({
        user_id: body.merchantId || '00000000-0000-0000-0000-000000000000',
        action: 'gap600_invoice_created', entity_type: 'btc_invoice',
        entity_id: data.id || data.invoice_id,
        metadata: { amount: body.amount, currency: body.currency },
      });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'status') {
      const res = await fetch(`${GAP600_BASE_URL}/invoices/${body.invoiceId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gap600 status failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify') {
      const res = await fetch(`${GAP600_BASE_URL}/transactions/verify`, {
        method: 'POST', headers, body: JSON.stringify({ tx_hash: body.txHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gap600 verify failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Gap600 error:', err);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
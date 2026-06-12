import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json();
    const { customer, transaction, country, payment_method, notification_url, redirect_url } = body;
    if (!customer?.id || !transaction?.id || !transaction?.amount || !transaction?.currency) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const LATAM = ['BRA','MEX','COL','CHL','ARG','PER','ECU','BOL','URY','BR','MX','CO','CL','AR','PE','EC','BO','UY'];
    const reqCountry = (country || 'BRA').toUpperCase();
    if (!LATAM.includes(reqCountry)) {
      return new Response(JSON.stringify({ error: 'SmartFastPay is only available for LATAM countries', allowed_countries: LATAM }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const TOKEN = Deno.env.get('SMARTFASTPAY_API_TOKEN');
    const baseUrl = Deno.env.get('SMARTFASTPAY_ENV') === 'live' ? 'https://api.smartfastpay.com' : 'https://sandbox.smartfastpay.com';
    const webhookUrl = notification_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/smartfastpay-webhook`;

    const payload = {
      customer: {
        id: customer.id, name: customer.name || 'Customer',
        email: customer.email || undefined,
        document: customer.document || { type: 'CPF', number: '00000000000' },
        phone: customer.phone || undefined,
      },
      country: country || 'BRA', payment_method: payment_method || 'pix',
      notification_url: webhookUrl, redirect_url: redirect_url || undefined,
      transaction: { id: transaction.id, currency: transaction.currency || 'BRL', amount: parseFloat(transaction.amount) },
    };

    if (!TOKEN) {
      const simId = crypto.randomUUID();
      return new Response(JSON.stringify({
        requestId: simId, simulation: true,
        data: { url: `https://sandbox.smartfastpay.com/checkout/${simId}`, transaction_id: transaction.id, payment_method: payment_method || 'pix', qr_code: 'PIX_QR_SIMULATED_' + simId.slice(0,8), expires_in: 1800, status: 'pending' },
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await fetch(`${baseUrl}/v1/payin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: data?.message || 'SmartFastPay API error', details: data }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('SmartFastPay error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
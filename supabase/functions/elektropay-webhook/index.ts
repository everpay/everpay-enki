import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    // Fail-closed HMAC verification using ELEKTROPAY_WEBHOOK_SECRET.
    const secret = Deno.env.get('ELEKTROPAY_WEBHOOK_SECRET');
    if (!secret) {
      console.error('ELEKTROPAY_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const rawBody = await req.text();
    const sigHeader =
      req.headers.get('x-elektropay-signature') ||
      req.headers.get('x-signature') ||
      req.headers.get('x-webhook-signature') ||
      '';
    if (!sigHeader) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    const provided = sigHeader.replace(/^sha256=/i, '').trim().toLowerCase();
    if (expected !== provided) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const payload = JSON.parse(rawBody);
    const { event, payment } = payload;
    if (payment?.payment_id) {
      let transactionStatus = 'pending';
      if (event === 'payment.complete') transactionStatus = 'completed';
      else if (event === 'payment.cancel') transactionStatus = 'failed';
      await supabase.from('transactions')
        .update({ status: transactionStatus, updated_at: new Date().toISOString() })
        .eq('provider_ref', payment.payment_id);
    }
    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Elektropay webhook error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
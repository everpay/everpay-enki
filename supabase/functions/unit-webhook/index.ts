import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('UNIT_WEBHOOK_SECRET');
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), { status: 401, headers: corsHeaders });
    }
    const body = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const eventData = body.data || body;
    const attrs = eventData.attributes || {};
    const status = attrs.status;
    if (eventData.type === 'payment' && status === 'Completed') {
      await supabase.from('transactions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('provider_ref', eventData.id);
    }
    if (eventData.type === 'payment' && (status === 'Rejected' || status === 'Returned')) {
      await supabase.from('transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('provider_ref', eventData.id);
    }
    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Unit webhook error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const expectedSecret = Deno.env.get('CIRCLE_WEBHOOK_SECRET');
    if (!expectedSecret) {
      console.error('CIRCLE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: corsHeaders });
    }
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), { status: 401, headers: corsHeaders });
    }
    const body = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    console.log('Circle webhook received:', body.type);
    if (body.type === 'transfer.completed' || body.type === 'transfer') {
      const transfer = body.data || body.transfer || body;
      if (transfer.id) {
        await supabase.from('transactions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('provider_ref', transfer.id);
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Circle webhook error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
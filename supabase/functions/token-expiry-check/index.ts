import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    const shortYear = currentYear.slice(-2);

    // Find active tokens that have expired
    const { data: expiredTokens, error: fetchError } = await supabase
      .from('payment_methods')
      .select('id, merchant_id, card_last4, card_brand, exp_month, exp_year')
      .eq('status', 'active')
      .not('exp_year', 'is', null)
      .not('exp_month', 'is', null);

    if (fetchError) throw fetchError;

    let expiredCount = 0;

    for (const token of expiredTokens || []) {
      const tokenYear = token.exp_year?.length === 2 ? `20${token.exp_year}` : token.exp_year;
      const tokenMonth = token.exp_month?.padStart(2, '0');
      
      // Compare: if token year < current year, or same year but month < current month
      const isExpired =
        Number(tokenYear) < Number(currentYear) ||
        (Number(tokenYear) === Number(currentYear) && Number(tokenMonth) < Number(currentMonth));

      if (isExpired) {
        await supabase
          .from('payment_methods')
          .update({ status: 'expired' })
          .eq('id', token.id);

        await supabase.from('token_events').insert({
          token_id: token.id,
          merchant_id: token.merchant_id,
          event_type: 'token.expired',
          metadata: { reason: 'card_expired', exp: `${token.exp_month}/${token.exp_year}` },
        });

        expiredCount++;
      }
    }

    // Also dispatch event if any expired
    if (expiredCount > 0) {
      await supabase.from('event_logs').insert({
        event_type: 'token.batch_expired',
        source_service: 'token-expiry-check',
        payload: { expired_count: expiredCount, run_at: now.toISOString() },
      });
    }

    return new Response(
      JSON.stringify({ success: true, expired_count: expiredCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

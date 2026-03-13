import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find reserves due for release
    const now = new Date().toISOString();
    const { data: dueReserves, error: fetchError } = await supabase
      .from('rolling_reserves')
      .select('*, merchants(name)')
      .eq('status', 'held')
      .lte('release_at', now);

    if (fetchError) throw fetchError;

    if (!dueReserves?.length) {
      return new Response(
        JSON.stringify({ message: 'No reserves due for release', released: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let releasedCount = 0;

    for (const reserve of dueReserves) {
      // Update reserve status
      const { error: updateError } = await supabase
        .from('rolling_reserves')
        .update({ status: 'released', released_at: now })
        .eq('id', reserve.id);

      if (updateError) {
        console.error(`Failed to release reserve ${reserve.id}:`, updateError);
        continue;
      }

      // Credit the merchant account
      const { error: accountError } = await supabase
        .from('accounts')
        .update({
          available_balance: supabase.rpc ? reserve.amount : 0, // Will be handled by trigger
        })
        .eq('merchant_id', reserve.merchant_id);

      releasedCount++;
      console.log(`Released reserve ${reserve.id}: ${reserve.amount} ${reserve.currency} for merchant ${reserve.merchant_id}`);
    }

    return new Response(
      JSON.stringify({ message: `Released ${releasedCount} reserves`, released: releasedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reserve release worker error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const dryRun = body.dry_run ?? false;

    // 1. Get all treasury accounts with their thresholds
    const { data: accounts, error } = await supabase
      .from('treasury_accounts')
      .select('*')
      .order('currency');

    if (error) throw error;

    // 2. Identify imbalances
    const deficits: Array<{ currency: string; shortfall: number; account: any }> = [];
    const surpluses: Array<{ currency: string; excess: number; account: any }> = [];

    for (const acct of (accounts || [])) {
      const balance = acct.balance || 0;
      const minThreshold = acct.min_threshold || 0;
      const targetBalance = acct.target_balance || 0;

      if (balance < minThreshold) {
        deficits.push({
          currency: acct.currency,
          shortfall: (targetBalance || minThreshold) - balance,
          account: acct,
        });
      } else if (targetBalance > 0 && balance > targetBalance * 1.5) {
        surpluses.push({
          currency: acct.currency,
          excess: balance - targetBalance,
          account: acct,
        });
      }
    }

    const movements: any[] = [];

    // 3. Match surpluses to deficits
    for (const deficit of deficits) {
      for (const surplus of surpluses) {
        if (surplus.excess <= 0) continue;

        // Get FX rate
        const { data: rateRow } = await supabase
          .from('fx_rates')
          .select('rate')
          .eq('base_currency', surplus.currency)
          .eq('quote_currency', deficit.currency)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const rate = rateRow?.rate || 1;
        const transferAmount = Math.min(surplus.excess, deficit.shortfall / rate);
        const convertedAmount = transferAmount * rate;

        if (transferAmount < 1) continue;

        const movement = {
          from_currency: surplus.currency,
          to_currency: deficit.currency,
          amount: transferAmount,
          converted_amount: convertedAmount,
          fx_rate: rate,
          purpose: 'rebalance',
          status: dryRun ? 'simulated' : 'completed',
        };

        if (!dryRun) {
          // Record movement
          await supabase.from('treasury_movements').insert(movement);

          // Update balances
          await supabase.from('treasury_accounts')
            .update({
              balance: surplus.account.balance - transferAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', surplus.account.id);

          await supabase.from('treasury_accounts')
            .update({
              balance: (deficit.account.balance || 0) + convertedAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', deficit.account.id);

          // Log event
          await supabase.from('event_logs').insert({
            event_type: 'treasury.rebalance',
            source_service: 'treasury-rebalance',
            payload: movement,
          });
        }

        surplus.excess -= transferAmount;
        deficit.shortfall -= convertedAmount;
        movements.push(movement);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRun,
      deficits: deficits.map(d => ({ currency: d.currency, shortfall: d.shortfall })),
      surpluses: surpluses.map(s => ({ currency: s.currency, excess: s.excess })),
      movements,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Treasury rebalance error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

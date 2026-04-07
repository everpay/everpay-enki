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

    const { merchant_id, amount, from_currency, to_currency, transaction_id } = await req.json();

    if (!merchant_id || !amount || !from_currency || !to_currency) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get mid-market rate
    const { data: rateRow } = await supabase
      .from('fx_rates')
      .select('*')
      .eq('base_currency', from_currency)
      .eq('quote_currency', to_currency)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const midRate = rateRow?.rate || 1;

    // 2. Get merchant spread config
    const { data: fxSettings } = await supabase
      .from('merchant_fx_settings')
      .select('*')
      .eq('merchant_id', merchant_id)
      .single();

    let spreadBps = fxSettings?.default_spread_bps || 100; // default 100bps = 1%

    // Check for currency-pair specific spread
    const pairKey = `${from_currency}_${to_currency}`;
    if (fxSettings?.currency_spreads && (fxSettings.currency_spreads as Record<string, number>)[pairKey]) {
      spreadBps = (fxSettings.currency_spreads as Record<string, number>)[pairKey];
    }

    // 3. Calculate applied rate with spread
    const appliedRate = midRate * (1 + spreadBps / 10000);
    const convertedAmount = amount * appliedRate;
    const revenueAmount = amount * midRate * (spreadBps / 10000);

    // 4. Store the fx_rate entry with spread data
    await supabase.from('fx_rates').insert({
      base_currency: from_currency,
      quote_currency: to_currency,
      rate: appliedRate,
      mid_market_rate: midRate,
      applied_rate: appliedRate,
      spread_bps: spreadBps,
      source: 'fx-convert',
    });

    // 5. Log FX revenue
    await supabase.from('fx_revenue_logs').insert({
      merchant_id,
      transaction_id: transaction_id || null,
      base_currency: from_currency,
      quote_currency: to_currency,
      mid_market_rate: midRate,
      applied_rate: appliedRate,
      spread_bps: spreadBps,
      amount,
      revenue_amount: revenueAmount,
    });

    // 6. Create ledger entries for the conversion
    // Debit source currency, credit target currency
    if (transaction_id) {
      const { data: merchantAccounts } = await supabase
        .from('accounts')
        .select('id, currency')
        .eq('merchant_id', merchant_id);

      const sourceAccount = merchantAccounts?.find(a => a.currency === from_currency);
      const targetAccount = merchantAccounts?.find(a => a.currency === to_currency);

      if (sourceAccount) {
        await supabase.from('ledger_entries').insert({
          transaction_id,
          account_id: sourceAccount.id,
          entry_type: 'debit',
          amount,
          currency: from_currency,
        });
      }

      if (targetAccount) {
        await supabase.from('ledger_entries').insert({
          transaction_id,
          account_id: targetAccount.id,
          entry_type: 'credit',
          amount: convertedAmount,
          currency: to_currency,
        });
      }
    }

    // 7. Log event
    await supabase.from('provider_events').insert({
      merchant_id,
      provider: 'everpay',
      event_type: 'fx.conversion',
      payload: {
        from_currency, to_currency, amount, converted_amount: convertedAmount,
        mid_rate: midRate, applied_rate: appliedRate, spread_bps: spreadBps,
        revenue: revenueAmount, transaction_id,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      from_currency,
      to_currency,
      amount,
      converted_amount: convertedAmount,
      mid_market_rate: midRate,
      applied_rate: appliedRate,
      spread_bps: spreadBps,
      revenue_amount: revenueAmount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('FX convert error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

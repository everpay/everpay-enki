import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common currency pairs to track
const CURRENCY_PAIRS = [
  ['USD', 'EUR'], ['USD', 'GBP'], ['USD', 'CAD'], ['USD', 'BRL'],
  ['USD', 'MXN'], ['USD', 'COP'], ['USD', 'BDT'], ['USD', 'PKR'],
  ['EUR', 'GBP'], ['EUR', 'USD'], ['GBP', 'USD'], ['GBP', 'EUR'],
  ['USD', 'KES'], ['USD', 'NGN'], ['USD', 'ZAR'], ['USD', 'INR'],
];

// Simulated mid-market rates (in production, call a real FX API)
const BASE_RATES: Record<string, number> = {
  'USD_EUR': 0.9215, 'USD_GBP': 0.7892, 'USD_CAD': 1.3645,
  'USD_BRL': 5.0125, 'USD_MXN': 17.1250, 'USD_COP': 3925.50,
  'USD_BDT': 110.25, 'USD_PKR': 278.50, 'EUR_GBP': 0.8565,
  'EUR_USD': 1.0852, 'GBP_USD': 1.2671, 'GBP_EUR': 1.1675,
  'USD_KES': 129.50, 'USD_NGN': 1550.00, 'USD_ZAR': 18.25,
  'USD_INR': 83.25,
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

    const rates: any[] = [];

    for (const [base, quote] of CURRENCY_PAIRS) {
      const key = `${base}_${quote}`;
      const baseRate = BASE_RATES[key] || 1;
      // Add slight randomization to simulate market movement (±0.3%)
      const jitter = 1 + (Math.random() - 0.5) * 0.006;
      const midRate = baseRate * jitter;

      const entry = {
        base_currency: base,
        quote_currency: quote,
        rate: midRate,
        mid_market_rate: midRate,
        spread_bps: 0,
        source: 'fx-rate-updater',
      };

      rates.push(entry);
    }

    const { error } = await supabase.from('fx_rates').insert(rates);
    if (error) throw error;

    await supabase.from('event_logs').insert({
      event_type: 'fx.rates_updated',
      source_service: 'fx-rate-updater',
      payload: { pairs_updated: rates.length, timestamp: new Date().toISOString() },
    });

    return new Response(JSON.stringify({
      success: true,
      pairs_updated: rates.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('FX rate updater error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

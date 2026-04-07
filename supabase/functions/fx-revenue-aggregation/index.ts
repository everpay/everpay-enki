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

    // Get all FX revenue logs from last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await supabase
      .from('fx_revenue_logs')
      .select('*')
      .gte('created_at', since);

    if (error) throw error;

    // Aggregate by merchant
    const merchantAgg: Record<string, {
      total_revenue: number;
      conversion_count: number;
      total_volume: number;
      avg_spread_bps: number;
      currencies: Set<string>;
    }> = {};

    for (const log of (logs || [])) {
      if (!merchantAgg[log.merchant_id]) {
        merchantAgg[log.merchant_id] = {
          total_revenue: 0,
          conversion_count: 0,
          total_volume: 0,
          avg_spread_bps: 0,
          currencies: new Set(),
        };
      }
      const m = merchantAgg[log.merchant_id];
      m.total_revenue += log.revenue_amount || 0;
      m.conversion_count += 1;
      m.total_volume += log.amount || 0;
      m.avg_spread_bps += log.spread_bps || 0;
      m.currencies.add(log.base_currency);
      m.currencies.add(log.quote_currency);
    }

    // Calculate averages
    const summary = Object.entries(merchantAgg).map(([merchantId, agg]) => ({
      merchant_id: merchantId,
      total_revenue: agg.total_revenue,
      conversion_count: agg.conversion_count,
      total_volume: agg.total_volume,
      avg_spread_bps: agg.conversion_count > 0 ? agg.avg_spread_bps / agg.conversion_count : 0,
      unique_currencies: agg.currencies.size,
    }));

    const platformTotal = summary.reduce((sum, s) => sum + s.total_revenue, 0);

    await supabase.from('event_logs').insert({
      event_type: 'fx.revenue_aggregated',
      source_service: 'fx-revenue-aggregation',
      payload: {
        period: '24h',
        platform_total_revenue: platformTotal,
        merchant_count: summary.length,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({
      success: true,
      period: '24h',
      platform_total_revenue: platformTotal,
      merchants: summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('FX revenue aggregation error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

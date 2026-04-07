import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Provider Routing Engine
 * 
 * Scores providers by: latency, success_rate, settlement_delay
 * Supports country-aware failover and weighted routing.
 * 
 * POST /routing-engine
 * Body: { amount, currency, country, card_brand?, risk_score?, merchant_id? }
 * Returns: { provider, score, fallback, reasoning }
 */

interface ProviderScore {
  provider: string;
  score: number;
  latency: number;
  successRate: number;
  settlementDays: number;
  region: string;
}

const PROVIDER_REGIONS: Record<string, string[]> = {
  shieldhub: ['US', 'CA', 'GB', 'GLOBAL'],
  mondo: ['GB', 'DE', 'FR', 'NL', 'ES', 'IT', 'EU'],
  facilitapay: ['BR', 'CO'],
  paygate10: ['IN', 'PK', 'MX', 'AR', 'EG'],
  ofa: ['CN', 'VN', 'TH', 'JP', 'KR', 'ID', 'MY', 'PH', 'HK', 'AU'],
  moneto: ['CA'],
  makapay: ['BD'],
  payok: ['TR'],
  lipad: ['KE', 'TZ', 'UG', 'GH', 'ZA', 'NG', 'RW', 'ET', 'CI', 'SN', 'CM'],
  matrix: ['GLOBAL'], // Gaming/Casino/Lottery only
  dcbank: ['CA'],     // Canadian e-Transfer processing
};

const CURRENCY_PROVIDERS: Record<string, string> = {
  USD: 'shieldhub', EUR: 'mondo', GBP: 'mondo', CAD: 'moneto',
  BRL: 'facilitapay', MXN: 'paygate10', COP: 'facilitapay',
  INR: 'paygate10', PKR: 'paygate10',
  KES: 'lipad', TZS: 'lipad', UGX: 'lipad', GHS: 'lipad', ZAR: 'lipad', NGN: 'lipad',
  CNY: 'ofa', JPY: 'ofa', KRW: 'ofa', THB: 'ofa', VND: 'ofa',
  TRY: 'payok', BDT: 'makapay',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency, country, card_brand, risk_score, merchant_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check admin PSP routes first (highest priority)
    if (merchant_id) {
      const { data: pspRoutes } = await supabase
        .from('psp_routes')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (pspRoutes?.length) {
        for (const route of pspRoutes) {
          const countryMatch = !route.country_match?.length || route.country_match.includes(country);
          const brandMatch = !route.card_brand_match?.length || route.card_brand_match.includes(card_brand);
          const riskMatch = !route.max_risk_score || (risk_score || 0) <= route.max_risk_score;

          if (countryMatch && brandMatch && riskMatch) {
            return new Response(JSON.stringify({
              provider: route.provider,
              fallback: route.fallback_provider || 'shieldhub',
              score: 100,
              reasoning: `Matched admin PSP route: ${route.name}`,
              source: 'psp_routes',
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      }

      // 2. Check merchant routing rules
      const { data: merchantRules } = await supabase
        .from('routing_rules')
        .select('*')
        .eq('merchant_id', merchant_id)
        .eq('active', true)
        .order('priority', { ascending: true });

      if (merchantRules?.length) {
        for (const rule of merchantRules) {
          const amountMatch = (!rule.amount_min || amount >= rule.amount_min) &&
                             (!rule.amount_max || amount <= rule.amount_max);
          const currencyMatch = !rule.currency_match?.length || rule.currency_match.includes(currency);

          if (amountMatch && currencyMatch) {
            return new Response(JSON.stringify({
              provider: rule.target_provider,
              fallback: rule.fallback_provider || 'shieldhub',
              score: 90,
              reasoning: `Matched merchant rule: ${rule.name}`,
              source: 'routing_rules',
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      }
    }

    // 3. Fetch processor metrics for scoring
    const { data: metrics } = await supabase
      .from('processor_metrics')
      .select('*');

    // 4. Score each provider
    const scores: ProviderScore[] = [];
    
    for (const [provider, regions] of Object.entries(PROVIDER_REGIONS)) {
      const isRegionMatch = !country || regions.includes(country) || regions.includes('GLOBAL');
      if (!isRegionMatch) continue;

      const metric = metrics?.find(m => m.processor_id === provider && (!country || m.region === country));
      const successRate = metric?.success_rate ?? 95;
      const avgLatency = metric?.avg_latency ?? 200;
      const avgFee = metric?.avg_fee ?? 2.5;

      // Composite score: success_rate (40%) + inverse_latency (30%) + inverse_fee (30%)
      const latencyScore = Math.max(0, 100 - (avgLatency / 10));
      const feeScore = Math.max(0, 100 - (avgFee * 10));
      const compositeScore = (successRate * 0.4) + (latencyScore * 0.3) + (feeScore * 0.3);

      // Boost for currency-matched providers
      const currencyBoost = CURRENCY_PROVIDERS[currency] === provider ? 15 : 0;
      // Penalty for high-risk transactions to less robust providers
      const riskPenalty = (risk_score || 0) > 70 && !['shieldhub', 'mondo'].includes(provider) ? 20 : 0;

      scores.push({
        provider,
        score: Math.round(compositeScore + currencyBoost - riskPenalty),
        latency: avgLatency,
        successRate,
        settlementDays: provider === 'shieldhub' ? 2 : provider === 'mondo' ? 3 : 5,
        region: country || 'GLOBAL',
      });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const bestProvider = scores[0];
    const fallback = scores[1];

    // Block if risk > 90
    if ((risk_score || 0) > 90) {
      return new Response(JSON.stringify({
        provider: null,
        fallback: null,
        score: 0,
        reasoning: 'Transaction blocked: risk score exceeds threshold (>90)',
        source: 'risk_engine',
        blocked: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      provider: bestProvider?.provider || 'shieldhub',
      fallback: fallback?.provider || 'shieldhub',
      score: bestProvider?.score || 0,
      reasoning: `Best match by composite score (success: ${bestProvider?.successRate}%, latency: ${bestProvider?.latency}ms)`,
      source: 'routing_engine',
      all_scores: scores.slice(0, 5),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Routing engine error:', err);
    return new Response(JSON.stringify({ error: 'Routing engine error', provider: 'shieldhub', fallback: 'mondo' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

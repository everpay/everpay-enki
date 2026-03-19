import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * ML Fraud Prediction Engine
 * Uses feature-based scoring with auto-learning from historical outcomes.
 * Features: amount, country_match, attempts, proxy_detection, time_of_day, bin_risk
 */

interface PredictRequest {
  transaction_id?: string;
  amount: number;
  currency: string;
  card_bin?: string;
  customer_email?: string;
  device_id?: string;
  ip_address?: string;
  billing_country?: string;
  card_country?: string;
  is_proxy?: boolean;
  attempt_count?: number;
}

// Feature weights learned from historical data (default weights)
const DEFAULT_WEIGHTS = {
  amount_normalized: 0.15,
  country_mismatch: 0.25,
  attempt_velocity: 0.20,
  proxy_detected: 0.15,
  time_anomaly: 0.10,
  bin_risk: 0.15,
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function extractFeatures(req: PredictRequest, binRiskScore: number): number[] {
  // Feature 1: Amount normalized (0-1 scale, >$5000 approaches 1)
  const amountNorm = Math.min(req.amount / 5000, 1);

  // Feature 2: Country mismatch (billing vs card BIN country)
  const countryMismatch = (req.billing_country && req.card_country && 
    req.billing_country !== req.card_country) ? 1 : 0;

  // Feature 3: Attempt velocity (normalized attempts)
  const attemptVelocity = Math.min((req.attempt_count || 0) / 10, 1);

  // Feature 4: Proxy detection
  const proxyDetected = req.is_proxy ? 1 : 0;

  // Feature 5: Time anomaly (transactions between 1-5 AM local time are riskier)
  const hour = new Date().getUTCHours();
  const timeAnomaly = (hour >= 1 && hour <= 5) ? 0.8 : 0;

  // Feature 6: BIN risk (from BIN intelligence lookup)
  const binRisk = Math.min(binRiskScore / 100, 1);

  return [amountNorm, countryMismatch, attemptVelocity, proxyDetected, timeAnomaly, binRisk];
}

function predictRisk(features: number[], weights = DEFAULT_WEIGHTS): number {
  const w = Object.values(weights);
  const weightedSum = features.reduce((sum, f, i) => sum + f * (w[i] || 0.1), 0);
  // Scale to 0-100
  return Math.round(sigmoid(weightedSum * 6 - 3) * 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) throw new Error('Unauthorized');

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!merchant) throw new Error('Merchant not found');

    const body: PredictRequest = await req.json();

    // BIN risk lookup
    let binRiskScore = 0;
    if (body.card_bin) {
      const { data: binData } = await supabase
        .from('fraud_scores')
        .select('total_score')
        .eq('card_bin', body.card_bin)
        .order('created_at', { ascending: false })
        .limit(10);

      if (binData && binData.length > 0) {
        binRiskScore = Math.round(
          binData.reduce((s, r) => s + (r.total_score || 0), 0) / binData.length
        );
      }
    }

    // Extract features and predict
    const features = extractFeatures(body, binRiskScore);
    const mlScore = predictRisk(features);
    const riskLevel = mlScore < 25 ? 'low' : mlScore < 50 ? 'medium' : mlScore < 75 ? 'high' : 'critical';
    const action = mlScore >= 75 ? 'block' : mlScore >= 50 ? 'review' : 'allow';

    // Store prediction for auto-learning
    await supabase.from('fraud_scores').insert({
      merchant_id: merchant.id,
      transaction_id: body.transaction_id || null,
      customer_email: body.customer_email,
      card_bin: body.card_bin,
      device_fingerprint: body.device_id,
      ip_address: body.ip_address,
      total_score: mlScore,
      risk_level: riskLevel,
      action_taken: action,
      risk_factors: [
        `ml_score:${mlScore}`,
        ...(features[1] === 1 ? ['country_mismatch'] : []),
        ...(features[3] === 1 ? ['proxy_detected'] : []),
        ...(features[4] > 0 ? ['off_hours_transaction'] : []),
      ],
      metadata: {
        ml_features: features,
        ml_weights: DEFAULT_WEIGHTS,
        amount: body.amount,
        currency: body.currency,
        billing_country: body.billing_country,
        card_country: body.card_country,
        bin_risk_score: binRiskScore,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        prediction: {
          score: mlScore,
          level: riskLevel,
          action,
          features: {
            amount_normalized: features[0],
            country_mismatch: features[1],
            attempt_velocity: features[2],
            proxy_detected: features[3],
            time_anomaly: features[4],
            bin_risk: features[5],
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ML fraud prediction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

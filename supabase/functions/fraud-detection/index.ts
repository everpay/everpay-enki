import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FraudCheckRequest {
  card_bin?: string;
  card_last4?: string;
  customer_email?: string;
  amount: number;
  currency: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  timezone?: string;
  transaction_id?: string;
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

    const body: FraudCheckRequest = await req.json();
    const {
      card_bin, card_last4, customer_email, amount, currency,
      device_fingerprint, ip_address, user_agent, device_type,
      timezone, transaction_id,
    } = body;

    const riskFactors: string[] = [];
    let velocityScore = 0;
    let deviceScore = 0;
    let geoScore = 0;

    // === 1. CARD VELOCITY CHECK ===
    if (customer_email || card_bin) {
      const identifier = customer_email || `bin_${card_bin}`;
      const today = new Date().toISOString().split('T')[0];

      // Check today's velocity
      const { data: velocity } = await supabase
        .from('card_velocity')
        .select('transaction_count')
        .eq('merchant_id', merchant.id)
        .eq('customer_identifier', identifier)
        .eq('transaction_date', today)
        .single();

      const txCount = velocity?.transaction_count || 0;

      if (txCount >= 10) {
        velocityScore += 40;
        riskFactors.push('high_velocity_today');
      } else if (txCount >= 5) {
        velocityScore += 20;
        riskFactors.push('elevated_velocity_today');
      }

      // Check recent transactions for rapid-fire pattern (last 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('customer_email', customer_email || '')
        .gte('created_at', oneHourAgo);

      if ((recentCount || 0) >= 5) {
        velocityScore += 30;
        riskFactors.push('rapid_fire_transactions');
      }

      // Check for multiple failed attempts
      const { count: failedCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('customer_email', customer_email || '')
        .eq('status', 'failed')
        .gte('created_at', oneHourAgo);

      if ((failedCount || 0) >= 3) {
        velocityScore += 25;
        riskFactors.push('multiple_failed_attempts');
      }

      // Update velocity counter
      if (velocity) {
        await supabase
          .from('card_velocity')
          .update({ transaction_count: txCount + 1 })
          .eq('merchant_id', merchant.id)
          .eq('customer_identifier', identifier)
          .eq('transaction_date', today);
      } else {
        await supabase.from('card_velocity').insert({
          merchant_id: merchant.id,
          customer_identifier: identifier,
          transaction_date: today,
          transaction_count: 1,
        });
      }
    }

    // === 2. DEVICE FINGERPRINT CHECK ===
    if (device_fingerprint) {
      // Check if this device has been seen before with different emails
      const { data: deviceHistory } = await supabase
        .from('device_analytics')
        .select('user_id, ip_address')
        .eq('device_id', device_fingerprint)
        .order('created_at', { ascending: false })
        .limit(20);

      if (deviceHistory && deviceHistory.length > 0) {
        const uniqueUsers = new Set(deviceHistory.map(d => d.user_id));
        if (uniqueUsers.size > 3) {
          deviceScore += 30;
          riskFactors.push('device_shared_across_users');
        }

        const uniqueIPs = new Set(deviceHistory.map(d => d.ip_address).filter(Boolean));
        if (uniqueIPs.size > 5) {
          deviceScore += 15;
          riskFactors.push('device_multiple_ips');
        }
      }
    }

    // Bot detection from user agent
    if (user_agent) {
      const botPatterns = ['bot', 'crawler', 'spider', 'headless', 'phantom', 'selenium', 'puppeteer'];
      if (botPatterns.some(p => user_agent.toLowerCase().includes(p))) {
        deviceScore += 50;
        riskFactors.push('bot_user_agent');
      }
    }

    // Suspicious device type / no user agent
    if (!user_agent) {
      deviceScore += 20;
      riskFactors.push('missing_user_agent');
    }

    // === 3. GEO / IP CHECK ===
    if (ip_address) {
      // Check for known risky IP patterns
      if (ip_address === 'unknown' || ip_address === '0.0.0.0') {
        geoScore += 25;
        riskFactors.push('unknown_ip');
      }

      // Check if IP has changed rapidly for same user
      const { data: recentDevices } = await supabase
        .from('device_analytics')
        .select('ip_address, timezone')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentDevices && recentDevices.length >= 2) {
        const recentIPs = new Set(recentDevices.map(d => d.ip_address).filter(Boolean));
        if (recentIPs.size >= 3) {
          geoScore += 20;
          riskFactors.push('ip_hopping');
        }

        // Timezone mismatch check
        const timezones = new Set(recentDevices.map(d => d.timezone).filter(Boolean));
        if (timezones.size >= 3) {
          geoScore += 15;
          riskFactors.push('timezone_inconsistency');
        }
      }
    }

    // === 4. AMOUNT ANOMALY CHECK ===
    if (amount > 5000) {
      geoScore += 10;
      riskFactors.push('high_value_transaction');
    }
    if (amount > 10000) {
      geoScore += 15;
      riskFactors.push('very_high_value_transaction');
    }

    // === CALCULATE TOTAL SCORE ===
    const totalScore = Math.min(velocityScore + deviceScore + geoScore, 100);
    const riskLevel = totalScore < 25 ? 'low' : totalScore < 50 ? 'medium' : totalScore < 75 ? 'high' : 'critical';
    const actionTaken = totalScore >= 75 ? 'block' : totalScore >= 50 ? 'review' : 'allow';

    // Store fraud score
    const { data: fraudScore, error: insertError } = await supabase
      .from('fraud_scores')
      .insert({
        merchant_id: merchant.id,
        transaction_id: transaction_id || null,
        customer_email,
        card_bin,
        device_fingerprint,
        ip_address,
        velocity_score: velocityScore,
        device_score: deviceScore,
        geo_score: geoScore,
        total_score: totalScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        action_taken: actionTaken,
        metadata: {
          amount, currency, device_type, timezone, user_agent,
          card_last4,
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        fraud_score: fraudScore,
        risk: {
          total_score: totalScore,
          velocity_score: velocityScore,
          device_score: deviceScore,
          geo_score: geoScore,
          level: riskLevel,
          action: actionTaken,
          factors: riskFactors,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fraud detection error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

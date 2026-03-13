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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) throw new Error('Unauthorized');

    // Get merchant for this user
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const body = await req.json();

    if (body.action === 'history') {
      // GET history
      let query = supabase
        .from('device_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (body.device_id) {
        query = query.eq('device_id', body.device_id);
      }

      const { data: analytics, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, analytics, count: analytics.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - track device
    const {
      device_id, device_type, os, os_version, browser, browser_version,
      screen_resolution, language, timezone, ip_address, user_agent,
      event_type, metadata,
    } = body;

    // Get client IP from request headers
    const clientIP = ip_address || 
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || 
      'unknown';

    // Calculate risk score
    let riskScore = 0;
    const riskFactors: string[] = [];

    if (!device_id) { riskScore += 20; riskFactors.push('missing_device_id'); }
    if (user_agent?.includes('bot') || user_agent?.includes('crawler')) {
      riskScore += 50; riskFactors.push('bot_detected');
    }
    if (metadata?.is_vpn || metadata?.is_proxy) {
      riskScore += 30; riskFactors.push('vpn_or_proxy');
    }

    const { data: analytics, error: insertError } = await supabase
      .from('device_analytics')
      .insert({
        user_id: user.id,
        merchant_id: merchant?.id || null,
        device_id: device_id || crypto.randomUUID(),
        device_type, os, os_version, browser, browser_version,
        screen_resolution, language, timezone,
        ip_address: clientIP,
        user_agent,
        risk_score: riskScore,
        risk_factors: riskFactors,
        event_type: event_type || 'login',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        analytics,
        risk_assessment: {
          score: riskScore,
          level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
          factors: riskFactors,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Device analytics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

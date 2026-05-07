import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Active Merchant Gateway Proxy
 * 
 * Proxies transaction operations to an external Ruby Active Merchant service.
 * Supports: authorize, capture, purchase, refund, void, verify (test harness)
 * 
 * The Ruby service handles the actual gateway communication via the activemerchant gem.
 */

interface GatewayRequest {
  action: 'authorize' | 'capture' | 'purchase' | 'refund' | 'void' | 'verify' | 'store' | 'unstore';
  gateway_credential_id: string;
  amount?: number;        // in cents
  currency?: string;
  card?: {
    number: string;
    exp_month: string;
    exp_year: string;
    cvc: string;
    holder_name?: string;
  };
  token?: string;          // for tokenized/stored cards
  transaction_ref?: string; // for capture/refund/void (provider reference)
  metadata?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrlAuth = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrlAuth, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = userData.user.id;

    const ACTIVE_MERCHANT_URL = Deno.env.get('ACTIVE_MERCHANT_URL');
    if (!ACTIVE_MERCHANT_URL) {
      return new Response(JSON.stringify({ 
        error: 'Active Merchant service not configured',
        help: 'Set ACTIVE_MERCHANT_URL secret to your Ruby Active Merchant API endpoint',
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ACTIVE_MERCHANT_SECRET = Deno.env.get('ACTIVE_MERCHANT_SECRET') || '';

    const body: GatewayRequest = await req.json();
    const { action, gateway_credential_id, amount, currency, card, token, transaction_ref, metadata } = body;

    if (!action || !gateway_credential_id) {
      return new Response(JSON.stringify({ error: 'action and gateway_credential_id are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validActions = ['authorize', 'capture', 'purchase', 'refund', 'void', 'verify', 'store', 'unstore'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch gateway credentials from DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: credData, error: credError } = await supabase
      .from('gateway_credentials')
      .select('*')
      .eq('id', gateway_credential_id)
      .single();

    if (credError || !credData) {
      return new Response(JSON.stringify({ error: 'Gateway credentials not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authorization: caller must own the merchant the credential belongs to,
    // OR be an admin/super_admin.
    const [{ data: merchantRow }, { data: roleRows }] = await Promise.all([
      supabase.from('merchants').select('id').eq('user_id', callerUserId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', callerUserId),
    ]);
    const isAdmin = (roleRows || []).some((r: any) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin && (!merchantRow || merchantRow.id !== credData.merchant_id)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the payload for the Ruby Active Merchant service
    const rubyPayload = {
      action,
      gateway: credData.gateway_name,
      gateway_type: credData.gateway_type,
      environment: credData.environment,
      credentials: credData.credentials, // VGS-tokenized; Ruby service decrypts via VGS outbound route
      amount,
      currency: currency || 'USD',
      card,
      token,
      transaction_ref,
      metadata,
    };

    // Proxy to Ruby Active Merchant service
    const rubyResponse = await fetch(`${ACTIVE_MERCHANT_URL}/api/v1/gateway/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACTIVE_MERCHANT_SECRET}`,
        'X-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify(rubyPayload),
    });

    const rubyData = await rubyResponse.json();

    // Log the transaction attempt
    const logEntry = {
      gateway_credential_id,
      action,
      gateway_name: credData.gateway_name,
      environment: credData.environment,
      amount,
      currency: currency || 'USD',
      success: rubyData.success || false,
      response_code: rubyData.response_code || null,
      message: rubyData.message || null,
      provider_ref: rubyData.authorization || rubyData.transaction_id || null,
    };
    console.log('Gateway proxy result:', JSON.stringify(logEntry));

    return new Response(JSON.stringify({
      success: rubyData.success || false,
      action,
      gateway: credData.gateway_name,
      environment: credData.environment,
      authorization: rubyData.authorization || null,
      transaction_id: rubyData.transaction_id || null,
      response_code: rubyData.response_code || null,
      message: rubyData.message || null,
      avs_result: rubyData.avs_result || null,
      cvv_result: rubyData.cvv_result || null,
      fraud_review: rubyData.fraud_review || false,
      raw: rubyData,
    }), {
      status: rubyResponse.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Gateway proxy error:', error);
    return new Response(JSON.stringify({ error: 'Gateway proxy error', detail: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

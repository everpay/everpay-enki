import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Gateway Test Harness
 * 
 * Validates merchant gateway credentials by performing a $1.00 authorize + void.
 * This is a non-destructive test that confirms the credentials work without
 * actually charging anything.
 * 
 * POST body: { gateway_credential_id: string }
 */

// Test card numbers that most gateways accept in sandbox mode
const TEST_CARDS: Record<string, { number: string; exp_month: string; exp_year: string; cvc: string; holder_name: string }> = {
  // Visa test card — universally accepted
  default: { number: '4111111111111111', exp_month: '12', exp_year: '2028', cvc: '123', holder_name: 'Test Cardholder' },
  // Mastercard
  mastercard: { number: '5555555555554444', exp_month: '12', exp_year: '2028', cvc: '123', holder_name: 'Test Cardholder' },
  // Amex
  amex: { number: '378282246310005', exp_month: '12', exp_year: '2028', cvc: '1234', holder_name: 'Test Cardholder' },
};

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
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = userData.user.id;

    const { gateway_credential_id } = await req.json();
    if (!gateway_credential_id) {
      return new Response(JSON.stringify({ error: 'gateway_credential_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch credential to get gateway name and environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cred, error: credErr } = await supabase
      .from('gateway_credentials')
      .select('*')
      .eq('id', gateway_credential_id)
      .single();

    if (credErr || !cred) {
      return new Response(JSON.stringify({ error: 'Gateway credentials not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: merchantRow }, { data: roleRows }] = await Promise.all([
      supabase.from('merchants').select('id').eq('user_id', callerUserId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', callerUserId),
    ]);
    const isAdmin = (roleRows || []).some((r: any) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin && (!merchantRow || merchantRow.id !== cred.merchant_id)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ACTIVE_MERCHANT_URL = Deno.env.get('ACTIVE_MERCHANT_URL');
    if (!ACTIVE_MERCHANT_URL) {
      return new Response(JSON.stringify({
        error: 'Active Merchant service not configured',
        help: 'Deploy the Ruby Active Merchant service and set ACTIVE_MERCHANT_URL secret',
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ACTIVE_MERCHANT_SECRET = Deno.env.get('ACTIVE_MERCHANT_SECRET') || '';
    const testCard = TEST_CARDS.default;
    const testAmount = 100; // $1.00 in cents
    const requestId = crypto.randomUUID();

    // Step 1: Authorize $1.00
    console.log(`[Test Harness] Starting auth test for ${cred.gateway_name} (${cred.environment}) — request: ${requestId}`);

    const authResponse = await fetch(`${ACTIVE_MERCHANT_URL}/api/v1/gateway/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACTIVE_MERCHANT_SECRET}`,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify({
        action: 'authorize',
        gateway: cred.gateway_name,
        gateway_type: cred.gateway_type,
        environment: cred.environment,
        credentials: cred.credentials,
        amount: testAmount,
        currency: 'USD',
        card: testCard,
        metadata: { test: 'true', harness: 'credential_validation' },
      }),
    });

    const authData = await authResponse.json();

    if (!authData.success) {
      console.log(`[Test Harness] Auth FAILED for ${cred.gateway_name}: ${authData.message}`);
      return new Response(JSON.stringify({
        test_passed: false,
        step_failed: 'authorize',
        gateway: cred.gateway_name,
        environment: cred.environment,
        error: authData.message || 'Authorization failed',
        response_code: authData.response_code,
        details: 'The $1.00 test authorization was declined. Check your API credentials and ensure the gateway account is active.',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Void the authorization (no money moves)
    const voidRef = authData.authorization || authData.transaction_id;
    console.log(`[Test Harness] Auth SUCCESS, voiding ${voidRef}...`);

    const voidResponse = await fetch(`${ACTIVE_MERCHANT_URL}/api/v1/gateway/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACTIVE_MERCHANT_SECRET}`,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify({
        action: 'void',
        gateway: cred.gateway_name,
        gateway_type: cred.gateway_type,
        environment: cred.environment,
        credentials: cred.credentials,
        transaction_ref: voidRef,
      }),
    });

    const voidData = await voidResponse.json();

    const testPassed = voidData.success !== false; // void success or not supported is OK

    console.log(`[Test Harness] Test ${testPassed ? 'PASSED' : 'PARTIAL'} for ${cred.gateway_name}`);

    // Update credential with test result
    await supabase
      .from('gateway_credentials')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', gateway_credential_id);

    return new Response(JSON.stringify({
      test_passed: testPassed,
      gateway: cred.gateway_name,
      environment: cred.environment,
      steps: {
        authorize: { success: true, authorization: voidRef },
        void: { success: voidData.success !== false, message: voidData.message },
      },
      message: testPassed
        ? `✅ ${cred.gateway_name} credentials validated successfully. $1.00 auth + void completed.`
        : `⚠️ Authorization succeeded but void failed. Credentials are valid but check void support.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Test harness error:', error);
    return new Response(JSON.stringify({ error: 'Test harness error', detail: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

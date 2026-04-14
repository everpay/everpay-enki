import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutRequest {
  merchant_id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  bank_account: string;
  account_holder: string;
  routing_number: string;
  notes?: string;
  breakdown: {
    gross_amount: number;
    refunds: number;
    chargebacks: number;
    processing_fee: number;
    net_amount: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEKTROPAY_API_KEY = Deno.env.get('ELEKTROPAY_API_KEY');
    if (!ELEKTROPAY_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment service is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'super_admin' || r.role === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payoutData: PayoutRequest = await req.json();

    console.log('Initiating payout via Elektropay API:', {
      merchant_id: payoutData.merchant_id,
      amount: payoutData.amount,
      currency: payoutData.currency
    });

    const elektropayResponse = await fetch('https://apiv3.elektropay.com/payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELEKTROPAY_API_KEY}`,
      },
      body: JSON.stringify({
        merchant_id: payoutData.merchant_id,
        merchant_name: payoutData.merchant_name,
        amount: payoutData.amount,
        currency: payoutData.currency,
        bank_account: payoutData.bank_account,
        account_holder: payoutData.account_holder,
        routing_number: payoutData.routing_number,
        notes: payoutData.notes,
        breakdown: payoutData.breakdown,
        timestamp: new Date().toISOString(),
        initiated_by: user.id,
      }),
    });

    if (!elektropayResponse.ok) {
      const errorText = await elektropayResponse.text();
      console.error('Elektropay API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Payment processor error: ${elektropayResponse.statusText}`, details: errorText }),
        { status: elektropayResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elektropayData = await elektropayResponse.json();

    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'payout_initiated',
      entity_type: 'payout',
      entity_id: payoutData.merchant_id,
      metadata: {
        amount: payoutData.amount,
        currency: payoutData.currency,
        merchant_name: payoutData.merchant_name,
        elektropay_response: elektropayData
      }
    });

    return new Response(
      JSON.stringify({ success: true, data: elektropayData, message: 'Payout initiated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in elektropay-payout function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

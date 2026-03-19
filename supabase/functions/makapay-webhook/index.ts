import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify webhook secret token (mandatory)
  const webhookSecret = Deno.env.get('MAKAPAY_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('MAKAPAY_WEBHOOK_SECRET is not configured');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = req.headers.get('x-webhook-secret');
  if (token !== webhookSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('MakaPay webhook received:', JSON.stringify(body));

    const trxId = body.trx_id || body.data?.transaction?.trx_id;
    const status = body.status || body.data?.transaction?.status;
    const reference = body.reference || body.data?.transaction?.reference;
    const providerTxnId = body.provider_transaction_id || body.data?.provider_transaction_id;

    if (!trxId && !reference) {
      return new Response(JSON.stringify({ error: 'Missing trx_id or reference' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the transaction by provider_ref (trx_id) or metadata reference
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, merchant_id, status')
      .eq('provider', 'makapay')
      .or(`provider_ref.eq.${trxId},provider_ref.eq.${reference}`)
      .single();

    if (!transaction) {
      console.warn('MakaPay webhook: transaction not found for', trxId, reference);
      return new Response(JSON.stringify({ received: true, matched: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map MakaPay status to internal status
    const statusMap: Record<string, string> = {
      success: 'completed',
      completed: 'completed',
      failed: 'failed',
      cancelled: 'failed',
      expired: 'failed',
      processing: 'pending',
      pending: 'pending',
    };
    const internalStatus = statusMap[status?.toLowerCase()] || 'pending';

    // Update transaction status
    if (transaction.status !== 'completed') {
      await supabase
        .from('transactions')
        .update({
          status: internalStatus,
          provider_ref: trxId || transaction.id,
          metadata: {
            makapay_webhook: body,
            provider_transaction_id: providerTxnId,
          },
        })
        .eq('id', transaction.id);
    }

    // Log provider event
    await supabase.from('provider_events').insert({
      merchant_id: transaction.merchant_id,
      transaction_id: transaction.id,
      provider: 'makapay',
      event_type: `payment.${internalStatus}`,
      payload: body,
    });

    // Optionally verify with MakaPay API
    if (internalStatus === 'completed' && trxId) {
      const apiKey = Deno.env.get('MAKAPAY_API_KEY');
      const apiSecret = Deno.env.get('MAKAPAY_API_SECRET');
      if (apiKey && apiSecret) {
        try {
          const verifyRes = await fetch('https://makapp.xyz/api/v1/payments/verify', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-API-KEY': apiKey,
              'X-API-SECRET': apiSecret,
            },
            body: JSON.stringify({
              trx_id: trxId,
              provider_code: body.provider || 'sslcommerz',
            }),
          });
          const verifyData = await verifyRes.json();
          console.log('MakaPay verify:', JSON.stringify(verifyData));

          if (verifyData.data?.transaction?.status !== 'success') {
            // Verification failed — revert
            await supabase
              .from('transactions')
              .update({ status: 'failed' })
              .eq('id', transaction.id);
          }
        } catch (err) {
          console.error('MakaPay verify error:', err);
        }
      }
    }

    return new Response(JSON.stringify({ received: true, matched: true, status: internalStatus }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('MakaPay webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

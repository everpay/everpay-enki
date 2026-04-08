import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-hmac-sha256',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    console.log('Elektropay webhook received:', payload.event, payload.type);

    const { type, event, payment } = payload;

    if (!payment?.payment_id) {
      return new Response(JSON.stringify({ error: 'No payment_id in webhook' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map Elektropay status to our status
    let status = 'open';
    if (event === 'payment.complete') status = 'complete';
    else if (event === 'payment.cancel') status = 'cancel';
    else if (event === 'payment.open') status = 'open';

    // Update our crypto payment record
    const { data: cryptoPayment } = await supabase
      .from('elektropay_payments')
      .select('*')
      .eq('elektropay_payment_id', payment.payment_id)
      .single();

    if (cryptoPayment) {
      await supabase.from('elektropay_payments').update({
        status,
        paid_amount: parseFloat(payment.paid_amount || '0'),
        crypto_amount: parseFloat(payment.payment_amount || '0'),
        remain_amount: parseFloat(payment.remain_amount || '0'),
        exchange_rate: payment.rate,
        blockchain_tx_hash: payment.trx_hash || null,
        updated_at: new Date().toISOString(),
      }).eq('id', cryptoPayment.id);

      // If payment completed, update the linked transaction
      if (status === 'complete' && cryptoPayment.transaction_id) {
        await supabase.from('transactions').update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        }).eq('id', cryptoPayment.transaction_id);
      }

      // If completed, update wallet balances
      if (status === 'complete' && cryptoPayment.merchant_id) {
        // Sync balances from Elektropay
        const apiKey = Deno.env.get('ELEKTROPAY_API_KEY');
        const apiSecret = Deno.env.get('ELEKTROPAY_API_SECRET');
        if (apiKey && apiSecret) {
          const basicAuth = btoa(`${apiKey}:${apiSecret}`);
          const res = await fetch('https://apiv3.elektropay.com/int/accounts', {
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
            },
          });
          const accountsData = await res.json();
          if (accountsData.accounts) {
            for (const acct of accountsData.accounts) {
              await supabase.from('elektropay_wallets').upsert({
                merchant_id: cryptoPayment.merchant_id,
                asset_id: acct.asset_id,
                currency: acct.currency,
                crypto_network: acct.crypto_network,
                balance: parseFloat(acct.balance || '0'),
                available: parseFloat(acct.available || '0'),
                on_hold: parseFloat(acct.on_hold || '0'),
                base_balance: parseFloat(acct.base_balance || '0'),
                base_currency: acct.base_currency || 'USD',
                elektropay_account_id: acct.account_id,
                elektropay_store_id: acct.store_id,
              }, { onConflict: 'merchant_id,asset_id' });
            }
          }
        }
      }
    }

    // Log the webhook event
    await supabase.from('event_logs').insert({
      event_type: `elektropay.${event}`,
      payload,
      source_service: 'elektropay',
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Elektropay webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

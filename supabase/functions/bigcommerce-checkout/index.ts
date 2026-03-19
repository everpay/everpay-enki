import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * BigCommerce Checkout Payment Processing
 * 
 * Server-side verification:
 * 1. Verify BigCommerce order totals match request
 * 2. Prevent client-side amount tampering
 * 3. Route payment through Everpay process-payment
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { store_hash, order_id, payment_token, amount, currency } = body;

    if (!store_hash || !order_id || !amount) {
      throw new Error('store_hash, order_id, and amount are required');
    }

    // Fetch store
    const { data: store } = await supabase
      .from('bigcommerce_stores')
      .select('*')
      .eq('store_hash', store_hash)
      .single();

    if (!store) throw new Error('Store not found');

    // Server-side amount verification (prevent tampering)
    let verifiedAmount = amount;
    if (store.access_token && !store.access_token.startsWith('sim_')) {
      const orderResp = await fetch(
        `https://api.bigcommerce.com/stores/${store_hash}/v2/orders/${order_id}`,
        {
          headers: {
            'X-Auth-Token': store.access_token,
            'Accept': 'application/json',
          },
        }
      );
      if (orderResp.ok) {
        const orderData = await orderResp.json();
        verifiedAmount = parseFloat(orderData.total_inc_tax || '0');

        // Check for tampering
        if (Math.abs(verifiedAmount - amount) > 0.01) {
          console.error(`Amount tampering detected! Client: ${amount}, Server: ${verifiedAmount}`);
          return new Response(
            JSON.stringify({
              error: 'Amount verification failed',
              detail: 'The payment amount does not match the order total',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Process payment via Everpay (calls process-payment internally)
    const paymentResult = await supabase.functions.invoke('process-payment', {
      body: {
        amount: verifiedAmount,
        currency: currency || 'USD',
        paymentMethod: 'card',
        description: `BigCommerce Order #${order_id}`,
        customerEmail: body.customer_email,
        cardDetails: body.card_details,
        billingDetails: body.billing_details,
      },
      headers: req.headers,
    });

    if (paymentResult.error) {
      throw new Error(`Payment processing failed: ${paymentResult.error.message}`);
    }

    const paymentData = paymentResult.data;

    // Update BigCommerce order with transaction reference
    if (paymentData?.transaction?.id) {
      await supabase
        .from('bigcommerce_orders')
        .update({
          status: paymentData.transaction.status,
          transaction_id: paymentData.transaction.id,
        })
        .eq('store_id', store.id)
        .eq('bc_order_id', String(order_id));

      // If live, update BigCommerce order status
      if (store.access_token && !store.access_token.startsWith('sim_') && paymentData.transaction.status === 'completed') {
        await fetch(
          `https://api.bigcommerce.com/stores/${store_hash}/v2/orders/${order_id}`,
          {
            method: 'PUT',
            headers: {
              'X-Auth-Token': store.access_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status_id: 11 }), // 11 = Awaiting Fulfillment
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: paymentData,
        verified_amount: verifiedAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('BigCommerce checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

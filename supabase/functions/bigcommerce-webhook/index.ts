import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * BigCommerce Webhook Handler
 * Receives order events from BigCommerce and syncs with Everpay transactions.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify webhook secret token (mandatory)
  const webhookSecret = Deno.env.get('BIGCOMMERCE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('BIGCOMMERCE_WEBHOOK_SECRET is not configured');
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
    const { scope, store_id: storeHash, data } = body;

    console.log(`BigCommerce webhook: ${scope} for store ${storeHash}`);

    // Find store in our system
    const { data: store } = await supabase
      .from('bigcommerce_stores')
      .select('id, merchant_id, access_token')
      .eq('store_hash', storeHash)
      .single();

    if (!store) {
      console.error('Unknown BigCommerce store:', storeHash);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (scope === 'store/order/created') {
      const orderId = data?.id?.toString();
      if (!orderId) return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

      // Fetch order details from BigCommerce (if live)
      let orderAmount = 0;
      let orderCurrency = 'USD';

      if (store.access_token && !store.access_token.startsWith('sim_')) {
        const orderResponse = await fetch(
          `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`,
          {
            headers: {
              'X-Auth-Token': store.access_token,
              'Accept': 'application/json',
            },
          }
        );
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          orderAmount = parseFloat(orderData.total_inc_tax || '0');
          orderCurrency = orderData.currency_code || 'USD';
        }
      }

      // Store BigCommerce order
      await supabase.from('bigcommerce_orders').insert({
        store_id: store.id,
        bc_order_id: orderId,
        amount: orderAmount,
        currency: orderCurrency,
        status: 'pending',
      });

      console.log(`BigCommerce order ${orderId} recorded for store ${storeHash}`);
    }

    if (scope === 'store/order/updated') {
      const orderId = data?.id?.toString();
      if (orderId) {
        // Update order status
        const { data: existingOrder } = await supabase
          .from('bigcommerce_orders')
          .select('id')
          .eq('store_id', store.id)
          .eq('bc_order_id', orderId)
          .single();

        if (existingOrder) {
          await supabase
            .from('bigcommerce_orders')
            .update({ status: data?.status?.label || 'updated' })
            .eq('id', existingOrder.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('BigCommerce webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

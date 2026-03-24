import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * BigCommerce Webhook Handler
 * Receives order events, uninstall events from BigCommerce.
 * Verifies webhook secret, logs events, syncs orders.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook secret (optional but recommended)
    const webhookSecret = Deno.env.get('BIGCOMMERCE_WEBHOOK_SECRET');
    if (webhookSecret) {
      const token = req.headers.get('x-webhook-secret');
      if (token !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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

    // Log all webhook events
    await supabase.from('bigcommerce_webhook_logs').insert({
      store_id: store.id,
      source: 'bigcommerce',
      event_type: scope,
      payload: body,
    });

    // Handle app uninstall
    if (scope === 'store/app/uninstalled') {
      await supabase
        .from('bigcommerce_stores')
        .update({
          active: false,
          uninstalled: true,
          webhook_registered: false,
        })
        .eq('id', store.id);

      console.log(`BigCommerce store ${storeHash} uninstalled`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle order events
    if (scope === 'store/order/created' || scope === 'store/order/statusUpdated') {
      const orderId = data?.id?.toString();
      if (!orderId) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch order details from BigCommerce (if live token)
      let orderAmount = 0;
      let orderCurrency = 'USD';
      let orderStatus = scope === 'store/order/created' ? 'pending' : 'updated';

      if (store.access_token && !store.access_token.startsWith('sim_')) {
        try {
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
            orderStatus = orderData.status || orderStatus;
          }
        } catch (e) {
          console.error('Failed to fetch BC order:', e);
        }
      }

      if (scope === 'store/order/created') {
        await supabase.from('bigcommerce_orders').insert({
          store_id: store.id,
          bc_order_id: orderId,
          amount: orderAmount,
          currency: orderCurrency,
          status: orderStatus,
        });
        console.log(`BigCommerce order ${orderId} recorded for store ${storeHash}`);
      } else {
        // Update existing order
        const { data: existingOrder } = await supabase
          .from('bigcommerce_orders')
          .select('id')
          .eq('store_id', store.id)
          .eq('bc_order_id', orderId)
          .single();

        if (existingOrder) {
          await supabase
            .from('bigcommerce_orders')
            .update({ status: orderStatus })
            .eq('id', existingOrder.id);
        }
      }
    }

    // Handle order updated
    if (scope === 'store/order/updated') {
      const orderId = data?.id?.toString();
      if (orderId) {
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
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

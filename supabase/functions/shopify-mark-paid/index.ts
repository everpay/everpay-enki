import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Shopify Mark-Paid Handler
 * 
 * Called after Everpay processes a successful payment for a Shopify order.
 * Creates a capture transaction on the Shopify order to mark it as paid.
 * 
 * Flow:
 *   Customer → Shopify Checkout (manual payment) → Order created (unpaid)
 *   → Redirect to Everpay Payment Page → Customer pays
 *   → This function marks the Shopify order as PAID
 * 
 * POST body:
 *   { order_id, transaction_id, merchant_id, amount?, currency? }
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
    const { order_id, transaction_id, merchant_id, amount, currency } = body;

    if (!order_id || !merchant_id) {
      return new Response(JSON.stringify({ error: 'order_id and merchant_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the Shopify store for this merchant
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('id, shop_domain, access_token')
      .eq('merchant_id', merchant_id)
      .eq('uninstalled', false)
      .not('access_token', 'is', null)
      .order('installed_at', { ascending: false })
      .limit(1)
      .single();

    if (!store?.access_token || !store?.shop_domain) {
      return new Response(JSON.stringify({ error: 'No active Shopify store found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Mark the order as paid by creating a capture transaction
    const txPayload = {
      transaction: {
        kind: 'capture',
        status: 'success',
        amount: amount ? String(amount) : undefined,
        currency: currency || 'USD',
        gateway: 'Everpay',
        source: 'external',
        authorization: transaction_id || `everpay_${Date.now()}`,
      },
    };

    const txRes = await fetch(
      `https://${store.shop_domain}/admin/api/2025-01/orders/${order_id}/transactions.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(txPayload),
      }
    );

    if (!txRes.ok) {
      const errText = await txRes.text();
      console.error(`Failed to mark Shopify order ${order_id} as paid:`, errText);
      return new Response(JSON.stringify({ error: 'Failed to mark order as paid', details: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txResult = await txRes.json();

    // Step 2: Add tags to the order
    try {
      await fetch(
        `https://${store.shop_domain}/admin/api/2025-01/orders/${order_id}.json`,
        {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': store.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order: {
              id: order_id,
              tags: 'EVERPAY_PAID, EVERPAY_SYNCED',
            },
          }),
        }
      );
    } catch (tagErr) {
      console.error('Failed to tag Shopify order:', tagErr);
    }

    // Step 3: Update internal DB — mark shopify_orders as paid
    await supabase.from('shopify_orders').upsert({
      store_id: store.id,
      shopify_order_id: String(order_id),
      amount: amount ? parseFloat(amount) : null,
      currency: currency || 'USD',
      status: 'paid',
    }, { onConflict: 'shopify_order_id' });

    // Step 4: Update the local transaction status
    if (transaction_id) {
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction_id);
    }

    // Step 5: Log the event
    await supabase.from('event_logs').insert({
      event_type: 'shopify.order.marked_paid',
      source_service: 'shopify-mark-paid',
      payload: { order_id, transaction_id, merchant_id, shopify_transaction: txResult.transaction?.id },
    });

    return new Response(JSON.stringify({
      success: true,
      order_id,
      shopify_transaction_id: txResult.transaction?.id,
      message: 'Order marked as paid',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Mark-paid error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Shopify Storefront Checkout Trigger
 * 
 * Updated flow for manual payment gateway:
 *   Customer → Shopify Checkout (manual payment) → Order created (unpaid)
 *   → Redirect to Everpay checkout → Customer pays → Mark order PAID
 * 
 * Handles TWO modes:
 *   1. draft_order: Creates a Shopify draft order, returns Everpay checkout URL
 *   2. existing_order: Takes an existing unpaid Shopify order ID, returns Everpay checkout URL
 * 
 * POST body (mode 1 - draft):
 *   { store_id, line_items: [{ variant_id, quantity }], customer_email?, return_url? }
 * 
 * POST body (mode 2 - existing order):
 *   { store_id, order_id, amount?, currency?, customer_email?, return_url? }
 * 
 * Returns:
 *   { checkout_url, order_id | draft_order_id }
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
    const { store_id, line_items, customer_email, return_url, order_id } = body;

    if (!store_id) {
      return new Response(JSON.stringify({ error: 'store_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get store
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('shop_domain, access_token, merchant_id')
      .eq('id', store_id)
      .single();

    if (!store?.access_token || !store?.shop_domain) {
      return new Response(JSON.stringify({ error: 'Store not configured or missing access token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const checkoutBaseUrl = 'https://checkout.everpayinc.com';

    // ─── MODE 2: Existing unpaid order (manual payment redirect) ───
    if (order_id) {
      // Fetch order details from Shopify
      const orderRes = await fetch(
        `https://${store.shop_domain}/admin/api/2025-01/orders/${order_id}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': store.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      let orderAmount = body.amount;
      let orderCurrency = body.currency || 'USD';
      let orderEmail = customer_email;

      if (orderRes.ok) {
        const { order } = await orderRes.json();
        orderAmount = orderAmount || order.total_price;
        orderCurrency = order.currency || orderCurrency;
        orderEmail = orderEmail || order.email;
      }

      if (!orderAmount) {
        return new Response(JSON.stringify({ error: 'Could not determine order amount' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const params = new URLSearchParams({
        amount: String(orderAmount),
        currency: orderCurrency,
        description: `Order from ${store.shop_domain}`,
        ref: `shopify_order_${order_id}`,
        merchant_id: store.merchant_id || '',
        source: 'shopify',
        order_id: String(order_id),
        success_url: return_url || `https://${store.shop_domain}/pages/thank-you`,
        cancel_url: return_url || `https://${store.shop_domain}/cart`,
      });

      if (orderEmail) params.set('email', orderEmail);

      const checkoutUrl = `${checkoutBaseUrl}/pay?${params.toString()}`;

      return new Response(JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        order_id,
        total: orderAmount,
        currency: orderCurrency,
        mode: 'existing_order',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── MODE 1: Draft order flow ───
    if (!line_items?.length) {
      return new Response(JSON.stringify({ error: 'line_items required for draft order mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const draftOrderPayload: any = {
      draft_order: {
        line_items: line_items.map((li: any) => ({
          variant_id: li.variant_id,
          quantity: li.quantity || 1,
          ...(li.title ? { title: li.title } : {}),
          ...(li.price ? { price: li.price } : {}),
        })),
        use_customer_default_address: true,
      },
    };

    if (customer_email) {
      draftOrderPayload.draft_order.customer = { email: customer_email };
    }

    const draftRes = await fetch(
      `https://${store.shop_domain}/admin/api/2025-01/draft_orders.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftOrderPayload),
      }
    );

    if (!draftRes.ok) {
      const errText = await draftRes.text();
      console.error('Draft order creation failed:', errText);
      return new Response(JSON.stringify({ error: 'Failed to create draft order' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { draft_order } = await draftRes.json();

    const params = new URLSearchParams({
      amount: draft_order.total_price,
      currency: draft_order.currency || 'USD',
      description: `Order from ${store.shop_domain}`,
      ref: `shopify_draft_${draft_order.id}`,
      merchant_id: store.merchant_id || '',
      source: 'shopify',
      order_id: String(draft_order.id),
      success_url: return_url || `https://${store.shop_domain}/pages/thank-you`,
      cancel_url: return_url || `https://${store.shop_domain}/cart`,
    });

    if (customer_email) {
      params.set('email', customer_email);
    }

    const checkoutUrl = `${checkoutBaseUrl}/pay?${params.toString()}`;

    return new Response(JSON.stringify({
      success: true,
      checkout_url: checkoutUrl,
      draft_order_id: draft_order.id,
      draft_order_name: draft_order.name,
      total: draft_order.total_price,
      currency: draft_order.currency,
      mode: 'draft_order',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Checkout trigger error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

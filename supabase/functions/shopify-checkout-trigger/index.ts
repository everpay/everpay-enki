import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Shopify Storefront Checkout Trigger
 * 
 * Called from the Shopify storefront (injected script or app proxy).
 * Creates a draft order in Shopify and returns an Everpay checkout URL.
 * 
 * POST body:
 *   { store_id, line_items: [{ variant_id, quantity }], customer_email?, return_url? }
 * 
 * Returns:
 *   { checkout_url, draft_order_id }
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
    const { store_id, line_items, customer_email, return_url, cart_token } = body;

    if (!store_id || !line_items?.length) {
      return new Response(JSON.stringify({ error: 'store_id and line_items required' }), {
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

    // Create Shopify draft order
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

    // Build Everpay checkout URL
    const checkoutBaseUrl = 'https://checkout.everpayinc.com';
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

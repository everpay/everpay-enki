import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Shopify Draft Order → Everpay Checkout Flow
 * 
 * 1. Create Draft Order on Shopify
 * 2. Generate Everpay checkout URL
 * 3. Return checkout link to redirect customer
 * 4. On payment success, complete the draft order via webhook
 */

interface DraftOrderRequest {
  store_id: string;
  line_items: Array<{
    title: string;
    price: string;
    quantity: number;
    variant_id?: string;
  }>;
  customer?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  currency?: string;
  note?: string;
  return_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) throw new Error('Unauthorized');

    const body: DraftOrderRequest = await req.json();
    const { store_id, line_items, customer, currency = 'USD', note, return_url } = body;

    if (!store_id || !line_items?.length) {
      throw new Error('store_id and line_items are required');
    }

    // Get the user's merchant to scope the store lookup
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) throw new Error('Merchant not found');

    // Fetch Shopify store credentials — scoped to the authenticated user's merchant
    const { data: store, error: storeError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('id', store_id)
      .eq('merchant_id', merchant.id)
      .single();

    if (storeError || !store) throw new Error('Store not found or unauthorized');

    const shopDomain = store.shop_domain;
    const accessToken = store.access_token;

    if (!shopDomain || !accessToken) {
      // Simulation mode for stores without live credentials
      const simulatedOrderId = `draft_${crypto.randomUUID().substring(0, 8)}`;
      const totalAmount = line_items.reduce((sum, item) => 
        sum + parseFloat(item.price) * item.quantity, 0
      );

      // Store simulated order
      await supabase.from('shopify_orders').insert({
        store_id,
        shopify_order_id: simulatedOrderId,
        amount: totalAmount,
        currency,
        status: 'draft',
      });

      const checkoutBase = 'https://checkout.everpayinc.com';
      const checkoutUrl = `${checkoutBase}/pay?order_id=${simulatedOrderId}&amount=${totalAmount}&currency=${currency}&source=shopify&store=${shopDomain || store_id}&return_url=${encodeURIComponent(return_url || '')}`;

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'simulation',
          draft_order: {
            id: simulatedOrderId,
            total_price: totalAmount.toFixed(2),
            currency,
            line_items: line_items.map(li => ({
              title: li.title,
              price: li.price,
              quantity: li.quantity,
            })),
            status: 'draft',
          },
          checkout_url: checkoutUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Live Shopify API call
    const shopifyResponse = await fetch(
      `https://${shopDomain}/admin/api/2024-01/draft_orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          draft_order: {
            line_items: line_items.map(item => ({
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              ...(item.variant_id ? { variant_id: item.variant_id } : {}),
            })),
            ...(customer ? {
              customer: {
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
              },
            } : {}),
            currency,
            note: note || 'Created via Everpay',
          },
        }),
      }
    );

    const shopifyData = await shopifyResponse.json();

    if (!shopifyResponse.ok) {
      throw new Error(`Shopify API error: ${JSON.stringify(shopifyData.errors || shopifyData)}`);
    }

    const draftOrder = shopifyData.draft_order;

    // Store order reference
    await supabase.from('shopify_orders').insert({
      store_id,
      shopify_order_id: String(draftOrder.id),
      amount: parseFloat(draftOrder.total_price),
      currency: draftOrder.currency,
      status: 'draft',
    });

    // Build Everpay checkout URL
    const everpayCheckoutUrl = `${return_url || '/checkout'}?order=${draftOrder.id}&amount=${draftOrder.total_price}&currency=${draftOrder.currency}`;

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'live',
        draft_order: {
          id: draftOrder.id,
          total_price: draftOrder.total_price,
          currency: draftOrder.currency,
          line_items: draftOrder.line_items,
          status: draftOrder.status,
          invoice_url: draftOrder.invoice_url,
        },
        checkout_url: everpayCheckoutUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify draft order error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

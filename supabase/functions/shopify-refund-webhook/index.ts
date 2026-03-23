import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain',
};

/**
 * Shopify Refund + Chargeback Webhook Handler
 * 
 * Handles:
 * - refunds/create → triggers Everpay refund + updates Supabase
 * - chargeback tagging on Shopify orders
 */

async function verifyShopifyHmac(rawBody: string, hmac: string | null, secret: string): Promise<boolean> {
  if (!hmac) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return digest === hmac;
}

async function tagShopifyOrder(shopDomain: string, accessToken: string, orderId: string, tag: string) {
  try {
    await fetch(`https://${shopDomain}/admin/api/2024-01/orders/${orderId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: { id: orderId, tags: tag },
      }),
    });
    console.log(`Tagged Shopify order ${orderId} with ${tag}`);
  } catch (err) {
    console.error('Failed to tag Shopify order:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const shopDomain = req.headers.get('x-shopify-shop-domain') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = JSON.parse(rawBody);

    // Look up the store to get credentials
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('id, merchant_id, access_token, shop_domain')
      .eq('shop_domain', shopDomain)
      .single();

    if (!store) {
      console.error('Unknown Shopify store:', shopDomain);
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine event type from payload structure
    const isRefund = payload.transactions && Array.isArray(payload.transactions);
    const isChargeback = payload.event === 'chargeback.created' || payload.reason;

    if (isRefund) {
      // Handle refund
      const refundTransaction = payload.transactions?.[0];
      const parentTransactionId = refundTransaction?.parent_id;
      const refundAmount = refundTransaction?.amount || payload.amount;
      const currency = payload.currency || 'USD';

      // Find the original transaction in our system
      const { data: originalTx } = await supabase
        .from('transactions')
        .select('id, merchant_id, amount')
        .eq('merchant_id', store.merchant_id)
        .or(`provider_ref.eq.${parentTransactionId},metadata->>'shopify_order_id'.eq.${payload.order_id}`)
        .single();

      if (originalTx) {
        // Create refund record
        await supabase.from('refunds').insert({
          transaction_id: originalTx.id,
          merchant_id: originalTx.merchant_id,
          amount: parseFloat(refundAmount),
          currency,
          status: 'completed',
          reason: 'Shopify refund',
          provider: 'shopify',
        });

        // Update transaction status
        const isPartial = parseFloat(refundAmount) < originalTx.amount;
        await supabase
          .from('transactions')
          .update({ status: isPartial ? 'partially_refunded' : 'refunded' })
          .eq('id', originalTx.id);

        // Tag Shopify order
        if (store.access_token && store.shop_domain) {
          await tagShopifyOrder(store.shop_domain, store.access_token, payload.order_id, isPartial ? 'PARTIAL_REFUND' : 'REFUNDED');
        }

        console.log(`Refund processed for transaction ${originalTx.id}`);
      }
    }

    if (isChargeback || payload.event === 'chargeback.created') {
      const transactionId = payload.transaction_id;

      // Find and update the transaction
      const { data: tx } = await supabase
        .from('transactions')
        .select('id, merchant_id')
        .eq('provider_ref', transactionId)
        .single();

      if (tx) {
        await supabase
          .from('transactions')
          .update({ status: 'chargeback' })
          .eq('id', tx.id);

        // Create dispute record
        await supabase.from('disputes').insert({
          merchant_id: tx.merchant_id,
          transaction_id: tx.id,
          amount: payload.amount || 0,
          currency: payload.currency || 'USD',
          status: 'open',
          reason: payload.reason || 'fraud',
          description: `Chargeback via Shopify - ${payload.reason || 'Unknown reason'}`,
        });

        // Tag Shopify order
        if (store.access_token && store.shop_domain && payload.order_id) {
          await tagShopifyOrder(store.shop_domain, store.access_token, payload.order_id, 'CHARGEBACK');
        }

        console.log(`Chargeback processed for transaction ${tx.id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Shopify webhook error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

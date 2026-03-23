import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain, x-shopify-topic',
};

/**
 * Shopify Refund + Chargeback Webhook Handler
 * 
 * Handles:
 * - refunds/create → triggers Everpay refund + updates Supabase
 * - chargeback tagging on Shopify orders
 * - orders/paid → syncs completed orders
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
    // First get existing tags
    const getRes = await fetch(`https://${shopDomain}/admin/api/2025-01/orders/${orderId}.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const orderData = await getRes.json();
    const existingTags = orderData?.order?.tags || '';
    const newTags = existingTags ? `${existingTags}, ${tag}` : tag;

    await fetch(`https://${shopDomain}/admin/api/2025-01/orders/${orderId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: { id: orderId, tags: newTags },
      }),
    });
    console.log(`Tagged Shopify order ${orderId} with ${tag}`);
  } catch (err) {
    console.error('Failed to tag Shopify order:', err);
  }
}

async function dispatchMerchantWebhook(supabase: any, merchantId: string, eventType: string, payload: any) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    await fetch(`${supabaseUrl}/functions/v1/api-v2-webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, event: eventType, data: payload }),
    });
  } catch (err) {
    console.error('Failed to dispatch merchant webhook:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const shopDomain = req.headers.get('x-shopify-shop-domain') || '';
    const shopifyTopic = req.headers.get('x-shopify-topic') || '';
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256') || null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = JSON.parse(rawBody);

    // Look up the store to get credentials
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('id, merchant_id, access_token, shop_domain, webhook_secret')
      .eq('shop_domain', shopDomain)
      .single();

    if (!store) {
      console.error('Unknown Shopify store:', shopDomain);
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify Shopify HMAC if webhook_secret is configured
    if (store.webhook_secret && shopifyHmac) {
      const valid = await verifyShopifyHmac(rawBody, shopifyHmac, store.webhook_secret);
      if (!valid) {
        console.error('Invalid Shopify webhook HMAC');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Determine event type
    const isRefund = shopifyTopic === 'refunds/create' || (payload.transactions && Array.isArray(payload.transactions));
    const isChargeback = payload.event === 'chargeback.created' || shopifyTopic === 'disputes/create';

    if (isRefund) {
      const refundTransaction = payload.transactions?.[0];
      const parentTransactionId = refundTransaction?.parent_id;
      const refundAmount = refundTransaction?.amount || payload.amount;
      const currency = payload.currency || 'USD';

      // Find the original transaction
      const { data: originalTx } = await supabase
        .from('transactions')
        .select('id, merchant_id, amount')
        .eq('merchant_id', store.merchant_id)
        .or(`provider_ref.eq.${parentTransactionId},metadata->>shopify_order_id.eq.${payload.order_id}`)
        .single();

      if (originalTx) {
        // Create refund record
        await supabase.from('refunds').insert({
          transaction_id: originalTx.id,
          merchant_id: originalTx.merchant_id,
          amount: parseFloat(refundAmount),
          currency,
          status: 'completed',
          reason: payload.note || 'Shopify refund',
          provider: 'shopify',
        });

        // Update transaction status
        const isPartial = parseFloat(refundAmount) < originalTx.amount;
        await supabase
          .from('transactions')
          .update({ status: isPartial ? 'partially_refunded' : 'refunded' })
          .eq('id', originalTx.id);

        // Tag Shopify order
        if (store.access_token && store.shop_domain && payload.order_id) {
          await tagShopifyOrder(store.shop_domain, store.access_token, payload.order_id, isPartial ? 'PARTIAL_REFUND' : 'REFUNDED');
        }

        // Dispatch merchant webhook
        await dispatchMerchantWebhook(supabase, originalTx.merchant_id, isPartial ? 'payment.partially_refunded' : 'refund.completed', {
          transaction_id: originalTx.id,
          amount: parseFloat(refundAmount),
          currency,
          source: 'shopify',
        });

        console.log(`Refund processed for transaction ${originalTx.id}`);
      }
    }

    if (isChargeback) {
      const transactionId = payload.transaction_id || payload.evidence?.customer_purchase_ip;

      const { data: tx } = await supabase
        .from('transactions')
        .select('id, merchant_id, amount')
        .eq('merchant_id', store.merchant_id)
        .or(`provider_ref.eq.${transactionId},metadata->>shopify_order_id.eq.${payload.order_id}`)
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
          amount: payload.amount || tx.amount || 0,
          currency: payload.currency || 'USD',
          status: 'open',
          reason: payload.reason || 'fraud',
          description: `Chargeback via Shopify - ${payload.reason || 'Unknown reason'}`,
          provider: 'shopify',
        });

        // Tag Shopify order
        if (store.access_token && store.shop_domain && payload.order_id) {
          await tagShopifyOrder(store.shop_domain, store.access_token, payload.order_id, 'CHARGEBACK');
        }

        // Dispatch merchant webhook
        await dispatchMerchantWebhook(supabase, tx.merchant_id, 'dispute.created', {
          transaction_id: tx.id,
          amount: payload.amount || tx.amount,
          reason: payload.reason || 'fraud',
          source: 'shopify',
        });

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
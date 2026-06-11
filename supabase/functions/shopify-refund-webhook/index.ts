import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain, x-shopify-topic',
};

async function verifyShopifyHmac(rawBody: string, hmac: string | null, secret: string): Promise<boolean> {
  if (!hmac) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return digest === hmac;
}

async function tagShopifyOrder(shopDomain: string, accessToken: string, orderId: string, tag: string) {
  try {
    const getRes = await fetch(`https://${shopDomain}/admin/api/2025-01/orders/${orderId}.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const orderData = await getRes.json();
    const existingTags = orderData?.order?.tags || '';
    const newTags = existingTags ? `${existingTags}, ${tag}` : tag;
    await fetch(`https://${shopDomain}/admin/api/2025-01/orders/${orderId}.json`, {
      method: 'PUT',
      headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: { id: orderId, tags: newTags } }),
    });
    console.log(`Tagged Shopify order ${orderId} with ${tag}`);
  } catch (err) { console.error('Failed to tag Shopify order:', err); }
}

async function dispatchMerchantWebhook(supabase: any, merchantId: string, eventType: string, payload: any) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    await fetch(`${supabaseUrl}/functions/v1/api-v1-webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, event: eventType, data: payload }),
    });
  } catch (err) { console.error('Failed to dispatch merchant webhook:', err); }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const shopDomain = req.headers.get('x-shopify-shop-domain') || '';
    const shopifyTopic = req.headers.get('x-shopify-topic') || '';
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256') || null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const payload = JSON.parse(rawBody);

    console.log(`Shopify webhook: topic=${shopifyTopic}, shop=${shopDomain}, order_id=${payload.id || payload.order_id}`);

    // Look up the store — try exact domain first, then partial match
    let store: any = null;
    const { data: exactStore } = await supabase.from('shopify_stores').select('id, merchant_id, access_token, shop_domain, webhook_secret')
      .eq('shop_domain', shopDomain).eq('uninstalled', false).limit(1).maybeSingle();
    store = exactStore;

    if (!store) {
      // Try matching by partial domain (e.g., "456283-4" in "456283-4.myshopify.com")
      const { data: stores } = await supabase.from('shopify_stores').select('id, merchant_id, access_token, shop_domain, webhook_secret')
        .eq('uninstalled', false).not('access_token', 'is', null);
      store = stores?.find((s: any) => shopDomain.includes(s.shop_domain?.split('.')[0]) || s.shop_domain?.includes(shopDomain.split('.')[0]));
    }

    if (!store) {
      console.error('Unknown Shopify store:', shopDomain);
      return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fail-closed HMAC verification. Prefer the per-store webhook_secret; fall back to
    // SHOPIFY_API_SECRET (the app-level secret used to sign webhooks) when the store
    // row predates per-store secrets. Never skip verification.
    const sharedSecret = store.webhook_secret || Deno.env.get('SHOPIFY_API_SECRET') || '';
    if (!sharedSecret) {
      console.error('Shopify webhook secret not configured for store:', store.id);
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!shopifyHmac) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const valid = await verifyShopifyHmac(rawBody, shopifyHmac, sharedSecret);
    if (!valid) {
      console.error('Invalid Shopify webhook HMAC');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ═══════════════════════════════════════════════════
    // ORDERS/CREATE — Record new Shopify orders as Everpay transactions
    // ═══════════════════════════════════════════════════
    if (shopifyTopic === 'orders/create' || shopifyTopic === 'orders/paid') {
      const orderId = String(payload.id);
      const orderName = payload.name || `#${payload.order_number}`;
      const totalPrice = parseFloat(payload.total_price || '0');
      const currency = (payload.currency || 'USD').toUpperCase();
      const customerEmail = payload.email || payload.contact_email || '';
      const financialStatus = payload.financial_status || 'paid';

      // Check if already recorded (idempotency)
      const { data: existing } = await supabase.from('transactions')
        .select('id').eq('merchant_id', store.merchant_id)
        .eq('provider_ref', `shopify_order_${orderId}`).maybeSingle();

      if (existing) {
        console.log(`Order ${orderId} already recorded as transaction ${existing.id}`);
        return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const statusMap: Record<string, string> = { paid: 'completed', authorized: 'pending', pending: 'pending', partially_paid: 'pending', refunded: 'refunded', voided: 'failed' };
      const internalStatus = statusMap[financialStatus] || 'pending';

      // Gather line items for description
      const lineItems = payload.line_items || [];
      const description = lineItems.map((li: any) => `${li.title} x${li.quantity}`).join(', ') || `Shopify ${orderName}`;

      // Create payment intent
      const { data: intent } = await supabase.from('payment_intents').insert({
        merchant_id: store.merchant_id, amount: totalPrice, currency, status: internalStatus === 'completed' ? 'succeeded' : 'processing',
        payment_method: payload.payment_gateway_names?.[0] || 'shopify',
        metadata: { source: 'shopify', shopify_order_id: orderId, shopify_order_name: orderName, customer_email: customerEmail },
      }).select('id').single();

      // Create transaction
      const { data: transaction, error: txErr } = await supabase.from('transactions').insert({
        merchant_id: store.merchant_id, amount: totalPrice, currency, provider: 'shopify',
        status: internalStatus, customer_email: customerEmail, description,
        provider_ref: `shopify_order_${orderId}`,
        metadata: {
          source: 'shopify', shopify_order_id: orderId, shopify_order_name: orderName,
          shopify_store_id: store.id, payment_intent_id: intent?.id,
          financial_status: financialStatus, fulfillment_status: payload.fulfillment_status,
          line_items: lineItems.map((li: any) => ({ title: li.title, quantity: li.quantity, price: li.price, sku: li.sku })),
          shipping: payload.total_shipping_price_set?.shop_money?.amount,
          tax: payload.total_tax, discount_codes: payload.discount_codes,
          billing_address: payload.billing_address, shipping_address: payload.shipping_address,
        },
      }).select().single();

      if (txErr) {
        console.error('Failed to create transaction for Shopify order:', txErr);
      } else {
        console.log(`Shopify order ${orderName} recorded as transaction ${transaction.id} (${internalStatus})`);

        // Create payment attempt
        await supabase.from('payment_attempts').insert({
          transaction_id: transaction.id, provider: 'shopify', attempt_number: 1,
          status: internalStatus, response_code: financialStatus, response_message: `Shopify ${orderName}`,
        });

        // Log provider event
        await supabase.from('provider_events').insert({
          merchant_id: store.merchant_id, transaction_id: transaction.id, provider: 'shopify',
          event_type: 'order.created', payload: { order_id: orderId, order_name: orderName, total: totalPrice, currency, financial_status: financialStatus },
        });

        // Tag the order
        if (store.access_token && store.shop_domain) {
          await tagShopifyOrder(store.shop_domain, store.access_token, orderId, 'EVERPAY_SYNCED');
        }

        // Dispatch webhook
        await dispatchMerchantWebhook(supabase, store.merchant_id, 'payment.completed', {
          transaction_id: transaction.id, payment_intent_id: intent?.id, amount: totalPrice,
          currency, status: internalStatus, provider: 'shopify', customer_email: customerEmail,
          source: 'shopify', order_id: orderId,
        });
      }

      return new Response(JSON.stringify({ received: true, transaction_id: transaction?.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ═══════════════════════════════════════════════════
    // REFUNDS/CREATE
    // ═══════════════════════════════════════════════════
    const isRefund = shopifyTopic === 'refunds/create' || (payload.transactions && Array.isArray(payload.transactions));
    if (isRefund) {
      const refundTransaction = payload.transactions?.[0];
      const parentTransactionId = refundTransaction?.parent_id;
      const refundAmount = refundTransaction?.amount || payload.amount;
      const currency = payload.currency || 'USD';

      const { data: originalTx } = await supabase.from('transactions').select('id, merchant_id, amount')
        .eq('merchant_id', store.merchant_id)
        .or(`provider_ref.eq.${parentTransactionId},provider_ref.eq.shopify_order_${payload.order_id}`)
        .maybeSingle();

      if (originalTx) {
        await supabase.from('refunds').insert({ transaction_id: originalTx.id, merchant_id: originalTx.merchant_id, amount: parseFloat(refundAmount), currency, status: 'completed', reason: payload.note || 'Shopify refund', provider: 'shopify' });
        const isPartial = parseFloat(refundAmount) < originalTx.amount;
        await supabase.from('transactions').update({ status: isPartial ? 'partially_refunded' : 'refunded' }).eq('id', originalTx.id);
        if (store.access_token && store.shop_domain && payload.order_id) await tagShopifyOrder(store.shop_domain, store.access_token, payload.order_id, isPartial ? 'PARTIAL_REFUND' : 'REFUNDED');
        await dispatchMerchantWebhook(supabase, originalTx.merchant_id, isPartial ? 'payment.partially_refunded' : 'refund.completed', { transaction_id: originalTx.id, amount: parseFloat(refundAmount), currency, source: 'shopify' });
        console.log(`Refund processed for transaction ${originalTx.id}`);
      }
    }

    // ═══════════════════════════════════════════════════
    // DISPUTES/CREATE — Chargebacks
    // ═══════════════════════════════════════════════════
    const isChargeback = payload.event === 'chargeback.created' || shopifyTopic === 'disputes/create';
    if (isChargeback) {
      const transactionId = payload.transaction_id;
      const { data: tx } = await supabase.from('transactions').select('id, merchant_id, amount')
        .eq('merchant_id', store.merchant_id)
        .or(`provider_ref.eq.${transactionId},provider_ref.eq.shopify_order_${payload.order_id}`)
        .maybeSingle();

      if (tx) {
        await supabase.from('transactions').update({ status: 'chargeback' }).eq('id', tx.id);
        await supabase.from('disputes').insert({ merchant_id: tx.merchant_id, transaction_id: tx.id, amount: payload.amount || tx.amount || 0, currency: payload.currency || 'USD', status: 'open', reason: payload.reason || 'fraud', description: `Chargeback via Shopify - ${payload.reason || 'Unknown'}`, provider: 'shopify' });
        if (store.access_token && store.shop_domain && payload.order_id) await tagShopifyOrder(store.shop_domain, store.access_token, payload.order_id, 'CHARGEBACK');
        await dispatchMerchantWebhook(supabase, tx.merchant_id, 'dispute.created', { transaction_id: tx.id, amount: payload.amount || tx.amount, reason: payload.reason || 'fraud', source: 'shopify' });
        console.log(`Chargeback processed for transaction ${tx.id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Shopify webhook error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

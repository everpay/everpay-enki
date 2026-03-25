-- Record the Shopify order as a payment_intent
INSERT INTO public.payment_intents (merchant_id, amount, currency, status, payment_method, metadata)
VALUES (
  '217cbda8-38a7-4fe0-98e9-805543799bf5',
  987.24,
  'USD',
  'succeeded',
  'shopify',
  '{"source": "shopify", "shopify_order_name": "#LD4VMG5A0", "customer_email": "testbuyer@everpayinc.com", "shopify_store": "streamsmile.com"}'::jsonb
);

-- Record the transaction
INSERT INTO public.transactions (merchant_id, amount, currency, status, provider, customer_email, description, provider_ref, metadata)
VALUES (
  '217cbda8-38a7-4fe0-98e9-805543799bf5',
  987.24,
  'USD',
  'completed',
  'shopify',
  'testbuyer@everpayinc.com',
  'StreamSmile Order #LD4VMG5A0 - Test purchase via Shopify checkout',
  'shopify_order_LD4VMG5A0',
  '{"source": "shopify", "shopify_order_name": "#LD4VMG5A0", "shopify_store": "streamsmile.com", "customer_name": "Test Buyer", "shipping_address": {"address1": "123 Teston St", "city": "Brampton", "province": "Ontario", "zip": "L7A 1Y5", "country": "Canada"}, "shipping_method": "Priority Shipping with Delicate Handling", "shipping_cost": "28.00", "total_cad": "1358.26"}'::jsonb
);
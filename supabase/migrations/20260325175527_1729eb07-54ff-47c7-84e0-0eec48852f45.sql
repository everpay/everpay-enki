-- Payment attempt for the Shopify order
INSERT INTO public.payment_attempts (transaction_id, provider, attempt_number, status, response_code, response_message)
VALUES ('d32db1d8-787c-484d-9d1e-f98a950bb712', 'shopify', 1, 'completed', 'paid', 'Shopify #LD4VMG5A0');

-- Provider event
INSERT INTO public.provider_events (merchant_id, transaction_id, provider, event_type, payload)
VALUES ('217cbda8-38a7-4fe0-98e9-805543799bf5', 'd32db1d8-787c-484d-9d1e-f98a950bb712', 'shopify', 'order.created', '{"order_name": "#LD4VMG5A0", "total": 987.24, "currency": "USD", "financial_status": "paid", "store": "streamsmile.com"}'::jsonb);
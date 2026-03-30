
CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  amount numeric,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  customer_email text,
  customer_name text,
  order_id text,
  payment_method text DEFAULT 'all',
  success_url text,
  cancel_url text,
  url text NOT NULL,
  products jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment links" ON public.payment_links
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_links.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own payment links" ON public.payment_links
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_links.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own payment links" ON public.payment_links
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_links.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can delete own payment links" ON public.payment_links
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_links.merchant_id AND merchants.user_id = auth.uid()));

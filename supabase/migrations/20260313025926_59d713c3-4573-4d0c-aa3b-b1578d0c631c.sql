
-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  product_type text DEFAULT 'physical',
  cost_price numeric,
  sku text,
  category text,
  tags text[],
  dimensions jsonb DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = products.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = products.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = products.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = products.merchant_id AND merchants.user_id = auth.uid()));

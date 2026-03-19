-- BigCommerce stores table
CREATE TABLE IF NOT EXISTS public.bigcommerce_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  store_hash text NOT NULL,
  access_token text,
  scope text,
  shop_domain text,
  installed_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  UNIQUE(store_hash)
);

ALTER TABLE public.bigcommerce_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BC stores" ON public.bigcommerce_stores
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = bigcommerce_stores.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own BC stores" ON public.bigcommerce_stores
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = bigcommerce_stores.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own BC stores" ON public.bigcommerce_stores
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = bigcommerce_stores.merchant_id AND merchants.user_id = auth.uid()));

-- BigCommerce orders table
CREATE TABLE IF NOT EXISTS public.bigcommerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.bigcommerce_stores(id) ON DELETE CASCADE,
  bc_order_id text,
  amount numeric,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  transaction_id uuid REFERENCES public.transactions(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bigcommerce_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BC orders" ON public.bigcommerce_orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bigcommerce_stores bs
    JOIN merchants m ON m.id = bs.merchant_id
    WHERE bs.id = bigcommerce_orders.store_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own BC orders" ON public.bigcommerce_orders
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM bigcommerce_stores bs
    JOIN merchants m ON m.id = bs.merchant_id
    WHERE bs.id = bigcommerce_orders.store_id AND m.user_id = auth.uid()
  ));
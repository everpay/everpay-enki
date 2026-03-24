
-- BigCommerce merchant configs (Everpay keys per BC store)
CREATE TABLE IF NOT EXISTS public.bigcommerce_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.bigcommerce_stores(id) ON DELETE CASCADE NOT NULL,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  everpay_public_key text,
  everpay_secret_encrypted text,
  test_mode boolean DEFAULT true,
  checkout_script_enabled boolean DEFAULT true,
  button_text text DEFAULT 'Pay with Everpay',
  button_bg_color text DEFAULT '#0052cc',
  button_text_color text DEFAULT '#ffffff',
  header_text text DEFAULT 'Pay securely with Everpay',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.bigcommerce_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own BC configs" ON public.bigcommerce_configs
  FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can manage own BC configs" ON public.bigcommerce_configs
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Add refresh_token and token metadata to bigcommerce_stores
ALTER TABLE public.bigcommerce_stores
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS token_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_registered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uninstalled boolean DEFAULT false;

-- BC webhook logs table
CREATE TABLE IF NOT EXISTS public.bigcommerce_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.bigcommerce_stores(id) ON DELETE CASCADE,
  source text DEFAULT 'bigcommerce',
  event_type text,
  payload jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bigcommerce_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own BC webhook logs" ON public.bigcommerce_webhook_logs
  FOR SELECT TO authenticated
  USING (store_id IN (
    SELECT bs.id FROM public.bigcommerce_stores bs
    JOIN public.merchants m ON bs.merchant_id = m.id
    WHERE m.user_id = auth.uid()
  ));

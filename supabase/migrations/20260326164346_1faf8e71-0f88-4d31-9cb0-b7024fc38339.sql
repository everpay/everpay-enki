
-- Table to store per-merchant Shopify app credentials
CREATE TABLE public.shopify_app_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  client_id text NOT NULL DEFAULT '',
  client_secret_encrypted text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id)
);

ALTER TABLE public.shopify_app_credentials ENABLE ROW LEVEL SECURITY;

-- Merchants can read/upsert their own credentials
CREATE POLICY "Merchants can view own shopify app creds"
  ON public.shopify_app_credentials FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can insert own shopify app creds"
  ON public.shopify_app_credentials FOR INSERT TO authenticated
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can update own shopify app creds"
  ON public.shopify_app_credentials FOR UPDATE TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can delete own shopify app creds"
  ON public.shopify_app_credentials FOR DELETE TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Pre-seed for everpay@gmail.com and justinrussell015@gmail.com
INSERT INTO public.shopify_app_credentials (merchant_id, client_id, client_secret_encrypted)
SELECT m.id, '6c8d322d6ea3f110e8a3e89b60580e31', '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'
FROM public.merchants m
JOIN auth.users u ON u.id = m.user_id
WHERE u.email IN ('everpay@gmail.com', 'justinrussell015@gmail.com')
ON CONFLICT (merchant_id) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret_encrypted = EXCLUDED.client_secret_encrypted,
  updated_at = now();

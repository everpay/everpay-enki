
CREATE TABLE public.tapix_enrichment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  tapix_handle text,
  shop_uid text,
  merchant_uid text,
  enrichment_type text NOT NULL DEFAULT 'card',
  shop_data jsonb,
  merchant_data jsonb,
  raw_find_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(transaction_id)
);

ALTER TABLE public.tapix_enrichment_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can read own enrichment cache"
  ON public.tapix_enrichment_cache FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage enrichment cache"
  ON public.tapix_enrichment_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_tapix_cache_transaction ON public.tapix_enrichment_cache(transaction_id);
CREATE INDEX idx_tapix_cache_merchant ON public.tapix_enrichment_cache(merchant_id);
CREATE INDEX idx_tapix_cache_shop_uid ON public.tapix_enrichment_cache(shop_uid);

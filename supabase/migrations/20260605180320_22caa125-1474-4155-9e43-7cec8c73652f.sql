
-- 1) Merchant-level flags
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS gambling_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS circoflows_mid text;

-- 2) High-risk processor assignments
CREATE TABLE IF NOT EXISTS public.merchant_high_risk_processors (
  merchant_id uuid PRIMARY KEY REFERENCES public.merchants(id) ON DELETE CASCADE,
  matrix_enabled boolean NOT NULL DEFAULT false,
  matrix_flow text NOT NULL DEFAULT 'checkout',
  valenspay_enabled boolean NOT NULL DEFAULT false,
  elektropay_enabled boolean NOT NULL DEFAULT false,
  circoflows_enabled boolean NOT NULL DEFAULT false,
  circoflows_mode text NOT NULL DEFAULT 'hosted',
  plgin_enabled boolean NOT NULL DEFAULT false,
  vertical text NOT NULL DEFAULT 'gambling',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_high_risk_processors TO authenticated;
GRANT ALL ON public.merchant_high_risk_processors TO service_role;

ALTER TABLE public.merchant_high_risk_processors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage high-risk processors" ON public.merchant_high_risk_processors;
CREATE POLICY "Admins manage high-risk processors"
  ON public.merchant_high_risk_processors
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP TRIGGER IF EXISTS trg_mhrp_updated ON public.merchant_high_risk_processors;
CREATE TRIGGER trg_mhrp_updated BEFORE UPDATE ON public.merchant_high_risk_processors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Catalog entries for new high-risk processors
INSERT INTO public.payment_processors (name, display_name, active)
VALUES
  ('plgin',      'Plgin (Plugg and Co)', true),
  ('circoflows', 'Circoflows',           true),
  ('valenspay',  'ValensPay PG6',        true),
  ('matrix',     'Matrix Partners',      true)
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, active = true;


-- Surcharge settings table for customer-pays-fees feature
CREATE TABLE public.surcharge_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  percentage_fee NUMERIC(5,4) DEFAULT 0.0000,
  fixed_fee NUMERIC(10,2) DEFAULT 0.00,
  max_fee_cap NUMERIC(10,2) NULL,
  apply_to_debit BOOLEAN DEFAULT FALSE,
  apply_to_credit BOOLEAN DEFAULT TRUE,
  disclosure_text TEXT DEFAULT 'A processing fee has been added to this transaction.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(merchant_id)
);

-- RLS policies
ALTER TABLE public.surcharge_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own surcharge settings"
ON public.surcharge_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = surcharge_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own surcharge settings"
ON public.surcharge_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = surcharge_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own surcharge settings"
ON public.surcharge_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = surcharge_settings.merchant_id AND merchants.user_id = auth.uid()));

-- Add provider column support for new providers
-- (transactions table already has provider as text, so PG10/OFA values will just work)

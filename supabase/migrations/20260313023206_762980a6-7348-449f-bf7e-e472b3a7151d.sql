
-- Processor fee profiles table
CREATE TABLE public.processor_fee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  percentage_fee numeric NOT NULL DEFAULT 2.9,
  fixed_fee numeric NOT NULL DEFAULT 0.30,
  chargeback_fee numeric NOT NULL DEFAULT 15.00,
  refund_fee numeric NOT NULL DEFAULT 0,
  settlement_days integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, provider, currency)
);

ALTER TABLE public.processor_fee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fee profiles" ON public.processor_fee_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = processor_fee_profiles.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own fee profiles" ON public.processor_fee_profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = processor_fee_profiles.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own fee profiles" ON public.processor_fee_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = processor_fee_profiles.merchant_id AND merchants.user_id = auth.uid()));

-- Routing rules table
CREATE TABLE public.routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  currency_match text[] DEFAULT '{}',
  amount_min numeric DEFAULT NULL,
  amount_max numeric DEFAULT NULL,
  target_provider text NOT NULL,
  fallback_provider text DEFAULT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routing rules" ON public.routing_rules
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = routing_rules.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own routing rules" ON public.routing_rules
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = routing_rules.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own routing rules" ON public.routing_rules
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = routing_rules.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can delete own routing rules" ON public.routing_rules
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = routing_rules.merchant_id AND merchants.user_id = auth.uid()));

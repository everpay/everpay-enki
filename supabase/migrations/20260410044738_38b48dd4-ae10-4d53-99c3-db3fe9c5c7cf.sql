
-- Merchant Pricing table
CREATE TABLE public.merchant_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL DEFAULT 'percentage' CHECK (model_type IN ('percentage', 'fixed', 'tiered', 'blended')),
  percentage_fee NUMERIC NOT NULL DEFAULT 2.9,
  fixed_fee NUMERIC NOT NULL DEFAULT 0.30,
  currency TEXT NOT NULL DEFAULT 'USD',
  tiers JSONB,
  sponsor_fee_pct NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, currency)
);

ALTER TABLE public.merchant_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on merchant_pricing"
  ON public.merchant_pricing FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Merchants view own pricing"
  ON public.merchant_pricing FOR SELECT
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_merchant_pricing_updated_at
  BEFORE UPDATE ON public.merchant_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fee Breakdowns table
CREATE TABLE public.fee_breakdowns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE UNIQUE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  transaction_amount NUMERIC NOT NULL DEFAULT 0,
  processor_fee NUMERIC NOT NULL DEFAULT 0,
  sponsor_fee NUMERIC NOT NULL DEFAULT 0,
  everpay_fee NUMERIC NOT NULL DEFAULT 0,
  total_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  pricing_model TEXT,
  pricing_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_breakdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on fee_breakdowns"
  ON public.fee_breakdowns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Merchants view own fee_breakdowns"
  ON public.fee_breakdowns FOR SELECT
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Enable realtime on fee_breakdowns
ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_breakdowns;

-- Reseller Splits table
CREATE TABLE public.reseller_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  revenue_share_pct NUMERIC NOT NULL DEFAULT 12.5,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reseller_id, merchant_id)
);

ALTER TABLE public.reseller_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on reseller_splits"
  ON public.reseller_splits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Resellers view own splits"
  ON public.reseller_splits FOR SELECT
  TO authenticated
  USING (reseller_id = auth.uid());

CREATE TRIGGER update_reseller_splits_updated_at
  BEFORE UPDATE ON public.reseller_splits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Billing Periods table
CREATE TABLE public.billing_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_volume NUMERIC NOT NULL DEFAULT 0,
  total_fees NUMERIC NOT NULL DEFAULT 0,
  total_processor_fees NUMERIC NOT NULL DEFAULT 0,
  total_sponsor_fees NUMERIC NOT NULL DEFAULT 0,
  total_everpay_fees NUMERIC NOT NULL DEFAULT 0,
  invoice_id UUID REFERENCES public.invoices(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'invoiced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on billing_periods"
  ON public.billing_periods FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Merchants view own billing_periods"
  ON public.billing_periods FOR SELECT
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_fee_breakdowns_merchant ON public.fee_breakdowns(merchant_id);
CREATE INDEX idx_fee_breakdowns_created ON public.fee_breakdowns(created_at);
CREATE INDEX idx_billing_periods_merchant ON public.billing_periods(merchant_id);
CREATE INDEX idx_billing_periods_status ON public.billing_periods(status);
CREATE INDEX idx_merchant_pricing_merchant ON public.merchant_pricing(merchant_id);
CREATE INDEX idx_reseller_splits_reseller ON public.reseller_splits(reseller_id);

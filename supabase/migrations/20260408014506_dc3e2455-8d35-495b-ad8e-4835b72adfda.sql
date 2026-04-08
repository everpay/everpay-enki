
-- merchant_endpoint_rate_limits
CREATE TABLE public.merchant_endpoint_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  endpoint_type TEXT NOT NULL CHECK (endpoint_type IN ('payments', 'payouts', 'api')),
  requests_per_minute INTEGER NOT NULL DEFAULT 120,
  burst_limit INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, endpoint_type)
);

ALTER TABLE public.merchant_endpoint_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own rate limits"
  ON public.merchant_endpoint_rate_limits FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can manage rate limits"
  ON public.merchant_endpoint_rate_limits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_merchant_endpoint_rate_limits_updated_at
  BEFORE UPDATE ON public.merchant_endpoint_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- merchant_risk_profiles
CREATE TABLE public.merchant_risk_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  adaptive_multiplier NUMERIC(5,3) NOT NULL DEFAULT 1.000,
  success_rate NUMERIC(5,2) DEFAULT 100,
  chargeback_rate NUMERIC(5,2) DEFAULT 0,
  fraud_score NUMERIC(5,2) DEFAULT 0,
  velocity_score NUMERIC(5,2) DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own risk profile"
  ON public.merchant_risk_profiles FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can manage risk profiles"
  ON public.merchant_risk_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_merchant_risk_profiles_updated_at
  BEFORE UPDATE ON public.merchant_risk_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- merchant_risk_signals
CREATE TABLE public.merchant_risk_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  value NUMERIC(10,4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_risk_signals_merchant ON public.merchant_risk_signals(merchant_id, recorded_at DESC);

ALTER TABLE public.merchant_risk_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own risk signals"
  ON public.merchant_risk_signals FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can manage risk signals"
  ON public.merchant_risk_signals FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

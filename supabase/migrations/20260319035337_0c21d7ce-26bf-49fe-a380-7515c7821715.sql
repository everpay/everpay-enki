
-- payment_intents: primary orchestration layer from LLM spec
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'created',
  processor_id TEXT,
  payment_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment intents" ON public.payment_intents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_intents.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own payment intents" ON public.payment_intents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_intents.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own payment intents" ON public.payment_intents
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payment_intents.merchant_id AND merchants.user_id = auth.uid()));

-- fx_rates: treasury FX management
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fx rates" ON public.fx_rates
  FOR SELECT TO authenticated USING (true);

-- reconciliation_reports
CREATE TABLE IF NOT EXISTS public.reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  internal_total NUMERIC DEFAULT 0,
  processor_total NUMERIC DEFAULT 0,
  difference NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reconciliation reports" ON public.reconciliation_reports
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = reconciliation_reports.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own reconciliation reports" ON public.reconciliation_reports
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = reconciliation_reports.merchant_id AND merchants.user_id = auth.uid()));

-- webhook_logs: delivery tracking
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) NOT NULL,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_logs.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own webhook logs" ON public.webhook_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_logs.merchant_id AND merchants.user_id = auth.uid()));

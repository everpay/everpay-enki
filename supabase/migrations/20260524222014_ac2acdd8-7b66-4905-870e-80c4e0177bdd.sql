
CREATE TABLE IF NOT EXISTS public.billing_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  customer_id UUID,
  payment_method_id UUID,
  mit_type TEXT NOT NULL CHECK (mit_type IN ('recurring','deferred','reload','unscheduled')),
  status TEXT NOT NULL DEFAULT 'active',
  currency TEXT NOT NULL DEFAULT 'USD',
  frequency TEXT,
  interval_count INTEGER DEFAULT 1,
  amount NUMERIC,
  variable_amount BOOLEAN DEFAULT false,
  amount_min NUMERIC,
  amount_max NUMERIC,
  intro_amount NUMERIC,
  intro_periods INTEGER,
  total_billing_cycles INTEGER,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  deferred_charge_at TIMESTAMPTZ,
  reload_threshold NUMERIC,
  reload_amount NUMERIC,
  current_balance NUMERIC DEFAULT 0,
  consent_ip TEXT,
  consent_user_agent TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_agreements_merchant ON public.billing_agreements(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_agreements_customer ON public.billing_agreements(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_agreements_next_billing ON public.billing_agreements(next_billing_at) WHERE status='active';

ALTER TABLE public.billing_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own billing agreements"
ON public.billing_agreements FOR SELECT
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all billing agreements"
ON public.billing_agreements FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_billing_agreements_updated_at
BEFORE UPDATE ON public.billing_agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

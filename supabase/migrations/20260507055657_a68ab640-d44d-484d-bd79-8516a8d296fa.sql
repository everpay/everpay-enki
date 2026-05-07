
-- balance alert configs
CREATE TABLE IF NOT EXISTS public.balance_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('below','above')),
  threshold_amount NUMERIC NOT NULL,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bac_merchant ON public.balance_alert_configs(merchant_id);
ALTER TABLE public.balance_alert_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants manage own bac" ON public.balance_alert_configs
  FOR ALL USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  ) WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  );

CREATE TRIGGER trg_bac_updated BEFORE UPDATE ON public.balance_alert_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- balance alert history
CREATE TABLE IF NOT EXISTS public.balance_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.balance_alert_configs(id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  threshold_type TEXT NOT NULL,
  threshold_amount NUMERIC NOT NULL,
  observed_balance NUMERIC NOT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notification_channel TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bah_merchant ON public.balance_alert_history(merchant_id, triggered_at DESC);
ALTER TABLE public.balance_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants read own bah" ON public.balance_alert_history
  FOR SELECT USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  );
CREATE POLICY "service insert bah" ON public.balance_alert_history
  FOR INSERT WITH CHECK (true);

-- payment_processors catalog
CREATE TABLE IF NOT EXISTS public.payment_processors (
  name TEXT PRIMARY KEY,
  display_name TEXT,
  acquirer_descriptor TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_processors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read payment_processors" ON public.payment_processors
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admins manage payment_processors" ON public.payment_processors
  FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.payment_processors(name, display_name, acquirer_descriptor, active) VALUES
  ('shieldhub','ShieldHub','EVERPAY*GENERIC',true),
  ('mondo','Mondo Open Banking','EVERPAY*MONDO',true),
  ('matrix','Matrix Partners','EVERPAY*MATRIX',true),
  ('makapay','MakaPay','EVERPAY*MAKA',true),
  ('paygate10','PayGate10','EVERPAY*PG10',true)
  ON CONFLICT (name) DO NOTHING;

-- merchant_processor_descriptors overrides
CREATE TABLE IF NOT EXISTS public.merchant_processor_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  processor TEXT NOT NULL REFERENCES public.payment_processors(name) ON DELETE CASCADE,
  descriptor TEXT NOT NULL,
  descriptor_text TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, processor)
);
ALTER TABLE public.merchant_processor_descriptors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchants read own mpd" ON public.merchant_processor_descriptors
  FOR SELECT USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  );
CREATE POLICY "admins manage mpd" ON public.merchant_processor_descriptors
  FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER trg_mpd_updated BEFORE UPDATE ON public.merchant_processor_descriptors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pp_updated BEFORE UPDATE ON public.payment_processors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1) Carespay processor
INSERT INTO public.processors (id, name, tier, region, currencies, approval_rate, active)
VALUES ('carespay', 'Carespay', '2',
  ARRAY['ASIA','CN','HK','JP','KR','SG','TW','TH','VN','MY','ID','PH'],
  ARRAY['USD','HKD','SGD','JPY','CNY'],
  92.50, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  region = EXCLUDED.region,
  currencies = EXCLUDED.currencies,
  approval_rate = EXCLUDED.approval_rate,
  active = EXCLUDED.active,
  updated_at = now();

-- 2) Processor pricing table (Carespay + future processors)
CREATE TABLE IF NOT EXISTS public.processor_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processor_id TEXT NOT NULL REFERENCES public.processors(id) ON DELETE CASCADE,
  category TEXT NOT NULL,            -- 'mdr', 'chargeback', 'refund', 'transaction', 'setup', 'reserve', 'wire', 'settlement'
  brand TEXT,                        -- 'Visa', 'MC/Diners/Discover', 'AE/JCB', etc.
  condition TEXT,                    -- '<3M USD/M', '>=0.9-2%', etc.
  rate NUMERIC,                      -- percentage as fraction (0.05 = 5%)
  fixed_amount NUMERIC,              -- flat fee
  currency TEXT DEFAULT 'USD',
  note TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processor_pricing TO authenticated;
GRANT ALL ON public.processor_pricing TO service_role;
ALTER TABLE public.processor_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read processor_pricing" ON public.processor_pricing FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admins manage processor_pricing" ON public.processor_pricing FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_processor_pricing_updated BEFORE UPDATE ON public.processor_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Carespay Asian pricelist
INSERT INTO public.processor_pricing (processor_id, category, brand, condition, rate, fixed_amount, currency, note, display_order) VALUES
  ('carespay','setup',NULL,NULL,NULL,1000,'USD','One-time setup fee',1),
  ('carespay','annual_service',NULL,NULL,NULL,1000,'USD','Annual service fee',2),
  ('carespay','mdr','MC/Diners/Discover','<3M USD/M',0.050,NULL,'USD',NULL,10),
  ('carespay','mdr','MC/Diners/Discover','>=3M USD/M',0.045,NULL,'USD',NULL,11),
  ('carespay','mdr','Visa','<1.5M USD/M',0.065,NULL,'USD',NULL,12),
  ('carespay','mdr','Visa','>=1.5M USD/M',0.060,NULL,'USD',NULL,13),
  ('carespay','mdr','AE/JCB',NULL,0.070,NULL,'USD',NULL,14),
  ('carespay','chargeback','MC/Diners/Discover/JCB','<0.9%',NULL,30,'USD',NULL,20),
  ('carespay','chargeback','MC/Diners/Discover/JCB','>=0.9-2%',NULL,50,'USD',NULL,21),
  ('carespay','chargeback','MC/Diners/Discover/JCB','>=2%',NULL,150,'USD',NULL,22),
  ('carespay','chargeback','AE','<0.9%',NULL,50,'USD',NULL,23),
  ('carespay','chargeback','AE','>=0.9-2%',NULL,80,'USD',NULL,24),
  ('carespay','chargeback','AE','>=2%',NULL,150,'USD',NULL,25),
  ('carespay','chargeback','Visa','<0.65%',NULL,30,'USD',NULL,26),
  ('carespay','chargeback','Visa','>=0.65-0.75%',NULL,50,'USD',NULL,27),
  ('carespay','chargeback','Visa','>=0.75%',NULL,150,'USD',NULL,28),
  ('carespay','refund',NULL,NULL,NULL,3,'USD','Per refund',30),
  ('carespay','transaction','Master/Visa/Diners/JCB/Discover','approved+declined',NULL,0.30,'USD',NULL,40),
  ('carespay','transaction','AE','approved+declined',NULL,0.50,'USD',NULL,41),
  ('carespay','reserve',NULL,'10% / 180 days',0.10,NULL,'USD','Rolling reserve',50),
  ('carespay','wire',NULL,'USDT',0.015,NULL,'USD','International wire fee',60),
  ('carespay','settlement','Visa/MC','T+7 → T+3 by volume',NULL,NULL,'USD','T+7 first / T+5 (>=50k 7d avg) / T+3 (>=100k 7d avg) / daily if >=3M monthly',70),
  ('carespay','settlement','AE/JCB','T+7',NULL,NULL,'USD',NULL,71)
ON CONFLICT DO NOTHING;

-- 3) ActiveServer 3DS admin users (operator console users)
CREATE TABLE public.threeds_acs_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator', -- master, admin, operator, viewer
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled
  master_auth_enabled BOOLEAN NOT NULL DEFAULT false,
  client_cert_pem TEXT,
  client_cert_fingerprint TEXT,
  client_cert_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threeds_acs_users TO authenticated;
GRANT ALL ON public.threeds_acs_users TO service_role;
ALTER TABLE public.threeds_acs_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read threeds_acs_users" ON public.threeds_acs_users FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admins manage threeds_acs_users" ON public.threeds_acs_users FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_threeds_acs_users_updated BEFORE UPDATE ON public.threeds_acs_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) ActiveServer 3DS merchant directory
CREATE TABLE public.threeds_acs_merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id_ref UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  merchant_name TEXT NOT NULL,
  acs_merchant_id TEXT NOT NULL UNIQUE,  -- the 12-15 digit ActiveServer Merchant ID
  acquirer_bin TEXT,
  acquirer_merchant_id TEXT,
  acquirer_name TEXT,
  country TEXT,
  mcc TEXT,
  merchant_url TEXT,
  status TEXT NOT NULL DEFAULT 'ENABLED', -- ENABLED, DISABLED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threeds_acs_merchants TO authenticated;
GRANT ALL ON public.threeds_acs_merchants TO service_role;
ALTER TABLE public.threeds_acs_merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read threeds_acs_merchants" ON public.threeds_acs_merchants FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins manage threeds_acs_merchants" ON public.threeds_acs_merchants FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_threeds_acs_merchants_updated BEFORE UPDATE ON public.threeds_acs_merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed three demo merchants matching the screenshot
INSERT INTO public.threeds_acs_merchants (merchant_name, acs_merchant_id, status, country, mcc) VALUES
  ('Test Merchant','123456789012345','ENABLED','US','5411'),
  ('Test Merchant Three','123456789036789','ENABLED','US','5411'),
  ('Test Merchant Two','123456789054321','ENABLED','US','5411')
ON CONFLICT (acs_merchant_id) DO NOTHING;

-- 5) 3DS Requestor + Backend v2 + Features config (per ACS merchant)
CREATE TABLE public.threeds_requestor_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acs_merchant_id UUID NOT NULL REFERENCES public.threeds_acs_merchants(id) ON DELETE CASCADE,
  requestor_id TEXT NOT NULL,
  requestor_name TEXT NOT NULL,
  requestor_url TEXT,
  api_version TEXT NOT NULL DEFAULT '2.2.0',
  supported_brands TEXT[] NOT NULL DEFAULT ARRAY['visa','mastercard','amex','jcb','discover']::text[],
  message_extensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  decoupled_auth_enabled BOOLEAN NOT NULL DEFAULT false,
  three_ri_enabled BOOLEAN NOT NULL DEFAULT false,
  whitelisting_enabled BOOLEAN NOT NULL DEFAULT true,
  threeds_method_url TEXT,
  notification_url TEXT,
  result_endpoint_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (acs_merchant_id, requestor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threeds_requestor_config TO authenticated;
GRANT ALL ON public.threeds_requestor_config TO service_role;
ALTER TABLE public.threeds_requestor_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read threeds_requestor_config" ON public.threeds_requestor_config FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins manage threeds_requestor_config" ON public.threeds_requestor_config FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_threeds_requestor_config_updated BEFORE UPDATE ON public.threeds_requestor_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
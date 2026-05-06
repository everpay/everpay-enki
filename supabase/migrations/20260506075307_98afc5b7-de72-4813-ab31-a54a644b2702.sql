
-- Treasury bank accounts (super-admin labelled accounts)
CREATE TABLE IF NOT EXISTS public.treasury_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('common','sweep','operating','merchant_fund','reserve','fees','payout','custody','other')),
  provider TEXT,
  bank_name TEXT,
  account_holder TEXT,
  account_number TEXT,
  routing_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  sort_code TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.treasury_bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage treasury bank accounts" ON public.treasury_bank_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER treasury_bank_accounts_set_updated BEFORE UPDATE ON public.treasury_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Liquidity pools
CREATE TABLE IF NOT EXISTS public.liquidity_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT,
  target_balance NUMERIC(20,4) DEFAULT 0,
  min_threshold NUMERIC(20,4) DEFAULT 0,
  max_threshold NUMERIC(20,4),
  current_balance NUMERIC(20,4) DEFAULT 0,
  bank_account_id UUID REFERENCES public.treasury_bank_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.liquidity_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage liquidity pools" ON public.liquidity_pools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER liquidity_pools_set_updated BEFORE UPDATE ON public.liquidity_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Treasury wallets (super-admin custody)
CREATE TABLE IF NOT EXISTS public.treasury_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  provider TEXT NOT NULL,
  asset TEXT NOT NULL,
  network TEXT,
  address TEXT,
  external_wallet_id TEXT,
  balance NUMERIC(28,8) DEFAULT 0,
  available NUMERIC(28,8) DEFAULT 0,
  yield_provider TEXT,
  yield_apr NUMERIC(8,4),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.treasury_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage treasury wallets" ON public.treasury_wallets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER treasury_wallets_set_updated BEFORE UPDATE ON public.treasury_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- International recipients (Wise-style)
CREATE TABLE IF NOT EXISTS public.recipients_intl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('individual','business')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  rail TEXT NOT NULL,
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  -- Bank routing fields (vary by country/rail)
  bank_name TEXT,
  account_number TEXT,
  routing_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  sort_code TEXT,
  bsb_code TEXT,
  ifsc_code TEXT,
  clabe TEXT,
  branch_code TEXT,
  account_type TEXT,
  intermediary_bank TEXT,
  -- Crypto
  wallet_address TEXT,
  wallet_network TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recipients_intl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage international recipients" ON public.recipients_intl FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER recipients_intl_set_updated BEFORE UPDATE ON public.recipients_intl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Provider onboarding tracker
CREATE TABLE IF NOT EXISTS public.provider_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, provider)
);
ALTER TABLE public.provider_onboardings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view provider onboardings" ON public.provider_onboardings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins manage provider onboardings" ON public.provider_onboardings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER provider_onboardings_set_updated BEFORE UPDATE ON public.provider_onboardings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

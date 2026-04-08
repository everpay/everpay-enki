
-- Elektropay crypto wallet per merchant
CREATE TABLE public.elektropay_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  currency text NOT NULL,
  crypto_network text,
  crypto_network_name text,
  balance numeric DEFAULT 0,
  available numeric DEFAULT 0,
  on_hold numeric DEFAULT 0,
  base_balance numeric DEFAULT 0,
  base_currency text DEFAULT 'USD',
  wallet_address text,
  address_id text,
  elektropay_account_id text,
  elektropay_store_id text,
  dedicate_id text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(merchant_id, asset_id)
);

ALTER TABLE public.elektropay_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own wallets" ON public.elektropay_wallets
  FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Merchants insert own wallets" ON public.elektropay_wallets
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Merchants update own wallets" ON public.elektropay_wallets
  FOR UPDATE USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Elektropay crypto payments
CREATE TABLE public.elektropay_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id),
  elektropay_payment_id text,
  payment_type text DEFAULT 'FIXED_AMOUNT',
  fiat_amount numeric NOT NULL,
  fiat_currency text NOT NULL DEFAULT 'USD',
  crypto_amount numeric,
  crypto_currency text,
  crypto_network text,
  exchange_rate numeric,
  rate_date timestamptz,
  paid_amount numeric DEFAULT 0,
  remain_amount numeric,
  status text DEFAULT 'open',
  payment_url text,
  qrcode_url text,
  wallet_address text,
  customer_email text,
  customer_name text,
  commission_rate numeric DEFAULT 0.05,
  commission_amount numeric DEFAULT 0,
  flat_fee numeric DEFAULT 1.00,
  total_fees numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  blockchain_tx_hash text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.elektropay_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own crypto payments" ON public.elektropay_payments
  FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Merchants insert crypto payments" ON public.elektropay_payments
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Merchants update crypto payments" ON public.elektropay_payments
  FOR UPDATE USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Elektropay withdrawals
CREATE TABLE public.elektropay_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  elektropay_withdraw_id text,
  amount numeric NOT NULL,
  asset_id text NOT NULL,
  withdraw_asset_id text,
  destination_address text NOT NULL,
  fee numeric DEFAULT 0,
  fee_asset_id text,
  status text DEFAULT 'open',
  crypto_network text,
  blockchain_tx_hash text,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.elektropay_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own withdrawals" ON public.elektropay_withdrawals
  FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Merchants insert withdrawals" ON public.elektropay_withdrawals
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Elektropay settings per merchant
CREATE TABLE public.elektropay_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  elektropay_store_id text,
  commission_rate numeric DEFAULT 0.05,
  flat_fee_usd numeric DEFAULT 1.00,
  default_crypto text DEFAULT 'USDT.TRC20',
  us_citizen boolean DEFAULT false,
  enabled_assets text[] DEFAULT ARRAY['USDT.TRC20', 'USDT.ERC20', 'BTC', 'ETH'],
  webhook_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.elektropay_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own settings" ON public.elektropay_settings
  FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Merchants manage own settings" ON public.elektropay_settings
  FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_elektropay_wallets_updated_at
  BEFORE UPDATE ON public.elektropay_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elektropay_payments_updated_at
  BEFORE UPDATE ON public.elektropay_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elektropay_withdrawals_updated_at
  BEFORE UPDATE ON public.elektropay_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elektropay_settings_updated_at
  BEFORE UPDATE ON public.elektropay_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin access policies
CREATE POLICY "Admins view all wallets" ON public.elektropay_wallets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins view all crypto payments" ON public.elektropay_payments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins view all withdrawals" ON public.elektropay_withdrawals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins view all settings" ON public.elektropay_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));


-- Enable RLS on all 6 remaining tables

ALTER TABLE public.iban_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- iban_accounts: merchant-scoped
DROP POLICY IF EXISTS "iban_accounts_select" ON public.iban_accounts;
CREATE POLICY "iban_accounts_select" ON public.iban_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = iban_accounts.merchant_id AND merchants.user_id = auth.uid()));
DROP POLICY IF EXISTS "iban_accounts_insert" ON public.iban_accounts;
CREATE POLICY "iban_accounts_insert" ON public.iban_accounts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = iban_accounts.merchant_id AND merchants.user_id = auth.uid()));
DROP POLICY IF EXISTS "iban_accounts_update" ON public.iban_accounts;
CREATE POLICY "iban_accounts_update" ON public.iban_accounts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = iban_accounts.merchant_id AND merchants.user_id = auth.uid()));

-- reserves: merchant-scoped
DROP POLICY IF EXISTS "reserves_select" ON public.reserves;
CREATE POLICY "reserves_select" ON public.reserves FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = reserves.merchant_id AND merchants.user_id = auth.uid()));

-- settlements: merchant-scoped
DROP POLICY IF EXISTS "settlements_select" ON public.settlements;
CREATE POLICY "settlements_select" ON public.settlements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = settlements.merchant_id AND merchants.user_id = auth.uid()));

-- payouts: merchant-scoped
DROP POLICY IF EXISTS "payouts_select" ON public.payouts;
CREATE POLICY "payouts_select" ON public.payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payouts.merchant_id AND merchants.user_id = auth.uid()));
DROP POLICY IF EXISTS "payouts_insert" ON public.payouts;
CREATE POLICY "payouts_insert" ON public.payouts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = payouts.merchant_id AND merchants.user_id = auth.uid()));

-- bank_accounts: merchant-scoped
DROP POLICY IF EXISTS "bank_accounts_select" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select" ON public.bank_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = bank_accounts.merchant_id AND merchants.user_id = auth.uid()));
DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = bank_accounts.merchant_id AND merchants.user_id = auth.uid()));
DROP POLICY IF EXISTS "bank_accounts_update" ON public.bank_accounts;
CREATE POLICY "bank_accounts_update" ON public.bank_accounts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = bank_accounts.merchant_id AND merchants.user_id = auth.uid()));

-- crypto_wallets: merchant-scoped
DROP POLICY IF EXISTS "crypto_wallets_select" ON public.crypto_wallets;
CREATE POLICY "crypto_wallets_select" ON public.crypto_wallets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = crypto_wallets.merchant_id AND merchants.user_id = auth.uid()));
DROP POLICY IF EXISTS "crypto_wallets_insert" ON public.crypto_wallets;
CREATE POLICY "crypto_wallets_insert" ON public.crypto_wallets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = crypto_wallets.merchant_id AND merchants.user_id = auth.uid()));

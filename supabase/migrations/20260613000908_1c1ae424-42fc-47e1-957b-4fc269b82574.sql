
-- itspaid_settings
CREATE TABLE IF NOT EXISTS public.itspaid_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','live')),
  enabled boolean NOT NULL DEFAULT true,
  default_notification_type smallint NOT NULL DEFAULT 0,
  default_send_method text NOT NULL DEFAULT 'ACH',
  webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itspaid_settings TO authenticated;
GRANT ALL ON public.itspaid_settings TO service_role;
ALTER TABLE public.itspaid_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Merchants manage their itspaid settings" ON public.itspaid_settings;
CREATE POLICY "Merchants manage their itspaid settings"
ON public.itspaid_settings FOR ALL TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_itspaid_settings_updated ON public.itspaid_settings;
CREATE TRIGGER trg_itspaid_settings_updated
BEFORE UPDATE ON public.itspaid_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- itspaid_transfers
CREATE TABLE IF NOT EXISTS public.itspaid_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  itspaid_transaction_id text,
  send_method text NOT NULL,
  direction text NOT NULL DEFAULT 'OUTGOING',
  currency text NOT NULL DEFAULT 'USD',
  amount numeric(18,2) NOT NULL,
  recipient_full_name text NOT NULL,
  recipient_email text,
  recipient_phone text,
  recipient_bank_account_last4 text,
  recipient_bank_routing text,
  plaid_account_id text,
  plaid_access_token_ref text,
  transfer_method text DEFAULT 'Default',
  public_description text,
  admin_message text,
  status text NOT NULL DEFAULT 'INITIATED',
  gateway_message text,
  gateway_error text,
  fees jsonb DEFAULT '{}'::jsonb,
  raw_request jsonb,
  raw_response jsonb,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_itspaid_transfers_merchant ON public.itspaid_transfers(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itspaid_transfers_txid ON public.itspaid_transfers(itspaid_transaction_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itspaid_transfers TO authenticated;
GRANT ALL ON public.itspaid_transfers TO service_role;
ALTER TABLE public.itspaid_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Merchants view their itspaid transfers" ON public.itspaid_transfers;
CREATE POLICY "Merchants view their itspaid transfers"
ON public.itspaid_transfers FOR SELECT TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Merchants insert their itspaid transfers" ON public.itspaid_transfers;
CREATE POLICY "Merchants insert their itspaid transfers"
ON public.itspaid_transfers FOR INSERT TO authenticated
WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Merchants update their itspaid transfers" ON public.itspaid_transfers;
CREATE POLICY "Merchants update their itspaid transfers"
ON public.itspaid_transfers FOR UPDATE TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
-- Protect bank routing column from anon/authenticated direct reads
REVOKE SELECT (recipient_bank_routing) ON public.itspaid_transfers FROM authenticated, anon;
DROP TRIGGER IF EXISTS trg_itspaid_transfers_updated ON public.itspaid_transfers;
CREATE TRIGGER trg_itspaid_transfers_updated
BEFORE UPDATE ON public.itspaid_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- itspaid_cards
CREATE TABLE IF NOT EXISTS public.itspaid_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  card_account_id text UNIQUE,
  recipient_account_id text,
  recipient_full_name text NOT NULL,
  recipient_email text NOT NULL,
  card_last4 text,
  card_expiration date,
  currency text NOT NULL DEFAULT 'USD',
  balance numeric(18,2) NOT NULL DEFAULT 0,
  initial_load numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'INITIATED',
  itspaid_transaction_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_itspaid_cards_merchant ON public.itspaid_cards(merchant_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itspaid_cards TO authenticated;
GRANT ALL ON public.itspaid_cards TO service_role;
ALTER TABLE public.itspaid_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Merchants view their itspaid cards" ON public.itspaid_cards;
CREATE POLICY "Merchants view their itspaid cards"
ON public.itspaid_cards FOR SELECT TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Merchants insert their itspaid cards" ON public.itspaid_cards;
CREATE POLICY "Merchants insert their itspaid cards"
ON public.itspaid_cards FOR INSERT TO authenticated
WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Merchants update their itspaid cards" ON public.itspaid_cards;
CREATE POLICY "Merchants update their itspaid cards"
ON public.itspaid_cards FOR UPDATE TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_itspaid_cards_updated ON public.itspaid_cards;
CREATE TRIGGER trg_itspaid_cards_updated
BEFORE UPDATE ON public.itspaid_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

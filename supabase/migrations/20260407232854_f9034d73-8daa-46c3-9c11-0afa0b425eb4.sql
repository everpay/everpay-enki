
-- Enhance fx_rates with spread tracking
ALTER TABLE public.fx_rates
  ADD COLUMN IF NOT EXISTS mid_market_rate numeric,
  ADD COLUMN IF NOT EXISTS applied_rate numeric,
  ADD COLUMN IF NOT EXISTS spread_bps integer DEFAULT 0;

-- FX Revenue Logs
CREATE TABLE IF NOT EXISTS public.fx_revenue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  mid_market_rate numeric NOT NULL,
  applied_rate numeric NOT NULL,
  spread_bps integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  revenue_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fx_revenue_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own fx revenue"
  ON public.fx_revenue_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Service role inserts fx revenue"
  ON public.fx_revenue_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Enhance treasury_accounts
ALTER TABLE public.treasury_accounts
  ADD COLUMN IF NOT EXISTS liquidity_type text NOT NULL DEFAULT 'hot',
  ADD COLUMN IF NOT EXISTS min_threshold numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Treasury Movements
CREATE TABLE IF NOT EXISTS public.treasury_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  amount numeric NOT NULL,
  converted_amount numeric NOT NULL DEFAULT 0,
  fx_rate numeric NOT NULL DEFAULT 1,
  purpose text NOT NULL DEFAULT 'rebalance',
  status text NOT NULL DEFAULT 'completed',
  notes text,
  initiated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treasury_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage treasury movements"
  ON public.treasury_movements FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Merchant FX Settings
CREATE TABLE IF NOT EXISTS public.merchant_fx_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  default_spread_bps integer NOT NULL DEFAULT 100,
  currency_spreads jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_fx_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own fx settings"
  ON public.merchant_fx_settings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Merchants update own fx settings"
  ON public.merchant_fx_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Insert fx settings"
  ON public.merchant_fx_settings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Enable realtime for treasury tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.treasury_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fx_revenue_logs;

-- Add new columns to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS subscription_starts text NOT NULL DEFAULT 'immediately',
  ADD COLUMN IF NOT EXISTS starts_day integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS starts_weekday_occurrence integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS starts_weekday text DEFAULT 'Monday',
  ADD COLUMN IF NOT EXISTS billing_period_unit text NOT NULL DEFAULT 'months',
  ADD COLUMN IF NOT EXISTS ends_type text NOT NULL DEFAULT 'never',
  ADD COLUMN IF NOT EXISTS ends_after_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ends_after_unit text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS trial_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_duration integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS trial_unit text DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS retry_logic text NOT NULL DEFAULT '4_retries_1d_fri_2d_5d',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS trial_price numeric DEFAULT 0;

-- Multi-currency pricing table
CREATE TABLE IF NOT EXISTS public.subscription_plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'EUR',
  subscription_price numeric NOT NULL DEFAULT 0,
  trial_price numeric NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan prices"
  ON public.subscription_plan_prices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscription_plans sp
      JOIN public.merchants m ON m.id = sp.merchant_id
      WHERE sp.id = plan_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan prices"
  ON public.subscription_plan_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subscription_plans sp
      JOIN public.merchants m ON m.id = sp.merchant_id
      WHERE sp.id = plan_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan prices"
  ON public.subscription_plan_prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscription_plans sp
      JOIN public.merchants m ON m.id = sp.merchant_id
      WHERE sp.id = plan_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan prices"
  ON public.subscription_plan_prices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscription_plans sp
      JOIN public.merchants m ON m.id = sp.merchant_id
      WHERE sp.id = plan_id AND m.user_id = auth.uid()
    )
  );
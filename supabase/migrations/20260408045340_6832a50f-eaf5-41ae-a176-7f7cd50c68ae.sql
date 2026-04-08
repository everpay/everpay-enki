-- Add lifecycle columns to payment_methods
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS previous_token_id uuid REFERENCES public.payment_methods(id),
ADD COLUMN IF NOT EXISTS last_used_at timestamptz,
ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id);

-- Index for lifecycle queries
CREATE INDEX IF NOT EXISTS idx_payment_methods_status ON public.payment_methods(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_merchant_id ON public.payment_methods(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_exp ON public.payment_methods(exp_year, exp_month);

-- Token events table
CREATE TABLE IF NOT EXISTS public.token_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  merchant_id uuid REFERENCES public.merchants(id),
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_events_token_id ON public.token_events(token_id);
CREATE INDEX IF NOT EXISTS idx_token_events_merchant_id ON public.token_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_token_events_event_type ON public.token_events(event_type);

-- RLS on token_events
ALTER TABLE public.token_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own token events"
ON public.token_events FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Merchants can insert own token events"
ON public.token_events FOR INSERT
TO authenticated
WITH CHECK (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Atomic increment function for usage_count
CREATE OR REPLACE FUNCTION public.increment_usage_count(token_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payment_methods
  SET usage_count = usage_count + 1,
      last_used_at = now(),
      updated_at = now()
  WHERE id = token_id;
END;
$$;
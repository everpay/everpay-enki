-- Device analytics table for fingerprinting
CREATE TABLE public.device_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL,
  device_id text NOT NULL,
  device_type text,
  os text,
  os_version text,
  browser text,
  browser_version text,
  screen_resolution text,
  language text,
  timezone text,
  ip_address text,
  user_agent text,
  risk_score integer DEFAULT 0,
  risk_factors text[] DEFAULT '{}',
  event_type text DEFAULT 'login',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device analytics"
  ON public.device_analytics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device analytics"
  ON public.device_analytics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add metadata column to transactions for card BIN and device data
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
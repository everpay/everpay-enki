
-- Processors strategy table
CREATE TABLE IF NOT EXISTS public.processors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT '2',
  region TEXT[] NOT NULL DEFAULT '{}',
  currencies TEXT[] NOT NULL DEFAULT '{}',
  approval_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Processor strategy (fallback chains)
CREATE TABLE IF NOT EXISTS public.processor_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_id TEXT NOT NULL REFERENCES public.processors(id) ON DELETE CASCADE,
  tier_level TEXT NOT NULL DEFAULT '1',
  routing_priority INTEGER NOT NULL DEFAULT 1,
  fallback_processor_id TEXT REFERENCES public.processors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(processor_id)
);

-- Platform fee markups (Everpay margin on top of processor cost)
CREATE TABLE IF NOT EXISTS public.platform_fee_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_id TEXT NOT NULL REFERENCES public.processors(id) ON DELETE CASCADE,
  merchant_id TEXT DEFAULT NULL,
  markup_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  markup_flat_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Routing attempt logs
CREATE TABLE IF NOT EXISTS public.routing_attempt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  processor_id TEXT NOT NULL REFERENCES public.processors(id) ON DELETE CASCADE,
  attempt_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  response_code TEXT,
  response_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enrich merchants table with strategy fields
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'GLOBAL';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS email TEXT;

-- Enable RLS
ALTER TABLE public.processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processor_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fee_markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_attempt_logs ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated read, super_admin full CRUD
CREATE POLICY "Authenticated can read processors" ON public.processors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage processors" ON public.processors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can read processor_strategy" ON public.processor_strategy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage processor_strategy" ON public.processor_strategy FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can read platform_fee_markups" ON public.platform_fee_markups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage platform_fee_markups" ON public.platform_fee_markups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can read routing_attempt_logs" ON public.routing_attempt_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage routing_attempt_logs" ON public.routing_attempt_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.processors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.processor_strategy;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_fee_markups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.routing_attempt_logs;

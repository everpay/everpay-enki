-- Gateway credentials table
CREATE TABLE public.gateway_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  gateway_name TEXT NOT NULL,
  gateway_type TEXT NOT NULL DEFAULT 'active_merchant' CHECK (gateway_type IN ('direct', 'active_merchant')),
  credentials JSONB NOT NULL DEFAULT '{}',
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, gateway_name, environment)
);

ALTER TABLE public.gateway_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own gateway credentials"
  ON public.gateway_credentials FOR SELECT
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can create own gateway credentials"
  ON public.gateway_credentials FOR INSERT
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can update own gateway credentials"
  ON public.gateway_credentials FOR UPDATE
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can delete own gateway credentials"
  ON public.gateway_credentials FOR DELETE
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_gateway_credentials_updated_at
  BEFORE UPDATE ON public.gateway_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration jobs table
CREATE TABLE public.migration_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  source_gateway TEXT NOT NULL,
  import_method TEXT NOT NULL DEFAULT 'csv' CHECK (import_method IN ('csv', 'api')),
  data_types TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  file_url TEXT,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  imported_records INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.migration_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own migration jobs"
  ON public.migration_jobs FOR SELECT
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can create own migration jobs"
  ON public.migration_jobs FOR INSERT
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_migration_jobs_updated_at
  BEFORE UPDATE ON public.migration_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
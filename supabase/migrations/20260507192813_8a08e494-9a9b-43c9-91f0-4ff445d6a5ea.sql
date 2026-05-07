
CREATE TABLE IF NOT EXISTS public.rebelfi_sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_id UUID,
  status TEXT NOT NULL DEFAULT 'success',
  scanned INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rebelfi_sync_runs_created ON public.rebelfi_sync_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rebelfi_sync_runs_merchant ON public.rebelfi_sync_runs (merchant_id);

ALTER TABLE public.rebelfi_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view rebelfi sync runs" ON public.rebelfi_sync_runs;
CREATE POLICY "Admins view rebelfi sync runs"
  ON public.rebelfi_sync_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Admins insert rebelfi sync runs" ON public.rebelfi_sync_runs;
CREATE POLICY "Admins insert rebelfi sync runs"
  ON public.rebelfi_sync_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

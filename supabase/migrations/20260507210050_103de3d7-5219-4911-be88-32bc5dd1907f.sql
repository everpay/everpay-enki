
ALTER TABLE public.rebelfi_sync_runs
  ADD COLUMN IF NOT EXISTS skipped_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dry_run BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS public.rebelfi_poll_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  interval_seconds INTEGER NOT NULL DEFAULT 300,
  merchant_id UUID,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  last_error TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- enforce single global row
CREATE UNIQUE INDEX IF NOT EXISTS rebelfi_poll_settings_singleton
  ON public.rebelfi_poll_settings ((true));

INSERT INTO public.rebelfi_poll_settings (enabled, interval_seconds)
SELECT false, 300
WHERE NOT EXISTS (SELECT 1 FROM public.rebelfi_poll_settings);

ALTER TABLE public.rebelfi_poll_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view rebelfi poll settings" ON public.rebelfi_poll_settings;
CREATE POLICY "Admins view rebelfi poll settings"
  ON public.rebelfi_poll_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Admins update rebelfi poll settings" ON public.rebelfi_poll_settings;
CREATE POLICY "Admins update rebelfi poll settings"
  ON public.rebelfi_poll_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Admins insert rebelfi poll settings" ON public.rebelfi_poll_settings;
CREATE POLICY "Admins insert rebelfi poll settings"
  ON public.rebelfi_poll_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER rebelfi_poll_settings_updated_at
  BEFORE UPDATE ON public.rebelfi_poll_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

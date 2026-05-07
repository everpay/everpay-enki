
DO $$ BEGIN
  CREATE TYPE public.alert_severity AS ENUM ('info','warn','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_category AS ENUM ('payment_failure','vgs_validation','webhook_signature','auth','rate_limit','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity public.alert_severity NOT NULL DEFAULT 'warn',
  category public.alert_category NOT NULL DEFAULT 'other',
  source text NOT NULL,
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  merchant_id uuid NULL,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz NULL,
  resolved_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON public.security_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_sev_cat ON public.security_alerts (severity, category, created_at DESC);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read security alerts" ON public.security_alerts;
CREATE POLICY "Admins read security alerts" ON public.security_alerts
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Admins update security alerts" ON public.security_alerts;
CREATE POLICY "Admins update security alerts" ON public.security_alerts
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.log_security_alert(
  _severity public.alert_severity,
  _category public.alert_category,
  _source text,
  _message text,
  _details jsonb DEFAULT '{}'::jsonb,
  _merchant_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.security_alerts(severity, category, source, message, details, merchant_id)
  VALUES (_severity, _category, _source, _message, COALESCE(_details,'{}'::jsonb), _merchant_id)
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

REVOKE ALL ON FUNCTION public.log_security_alert(public.alert_severity, public.alert_category, text, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;

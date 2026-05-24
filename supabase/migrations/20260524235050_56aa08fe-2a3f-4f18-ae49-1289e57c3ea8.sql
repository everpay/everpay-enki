
DROP POLICY IF EXISTS "Authenticated users can view fx rates" ON public.fx_rates;
CREATE POLICY "Admins view fx rates"
  ON public.fx_rates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read processor_strategy" ON public.processor_strategy;
CREATE POLICY "Admins read processor_strategy"
  ON public.processor_strategy FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read processors" ON public.processors;
CREATE POLICY "Admins read processors"
  ON public.processors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

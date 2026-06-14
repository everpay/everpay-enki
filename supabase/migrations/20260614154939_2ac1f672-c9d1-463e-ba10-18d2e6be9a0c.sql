
DROP POLICY IF EXISTS admin_read_everpay_webhooks ON public.everpay_webhooks;
CREATE POLICY admin_read_everpay_webhooks ON public.everpay_webhooks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS admin_all_3ds ON public.merchant_3ds_settings;
CREATE POLICY admin_all_3ds ON public.merchant_3ds_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS admin_all_psp_routes ON public.psp_routes;
CREATE POLICY admin_all_psp_routes ON public.psp_routes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS admin_all_notification_settings ON public.webhook_notification_settings;
CREATE POLICY admin_all_notification_settings ON public.webhook_notification_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

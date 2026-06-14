CREATE OR REPLACE FUNCTION public.current_user_has_any_role(_roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(auth.uid(), _roles)
$$;

CREATE OR REPLACE FUNCTION public.can_access_enki()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_has_any_role(ARRAY['admin','support','secops','super_admin']::public.app_role[])
$$;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

REVOKE EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_enki() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_enki(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_enki(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_enki(uuid) FROM service_role;

GRANT EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_enki() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_enki() TO service_role;

DROP POLICY IF EXISTS admin_read_everpay_webhooks ON public.everpay_webhooks;
CREATE POLICY admin_read_everpay_webhooks ON public.everpay_webhooks
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','secops']::public.app_role[]));

DROP POLICY IF EXISTS admin_all_3ds ON public.merchant_3ds_settings;
CREATE POLICY admin_all_3ds ON public.merchant_3ds_settings
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS admin_all_psp_routes ON public.psp_routes;
CREATE POLICY admin_all_psp_routes ON public.psp_routes
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin']::public.app_role[]))
  WITH CHECK (public.current_user_has_any_role(ARRAY['admin']::public.app_role[]));

DROP POLICY IF EXISTS admin_all_notification_settings ON public.webhook_notification_settings;
CREATE POLICY admin_all_notification_settings ON public.webhook_notification_settings
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Admins read threeds_acs_merchants" ON public.threeds_acs_merchants;
DROP POLICY IF EXISTS "Admins manage threeds_acs_merchants" ON public.threeds_acs_merchants;
CREATE POLICY "Admins read threeds_acs_merchants" ON public.threeds_acs_merchants
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Admins manage threeds_acs_merchants" ON public.threeds_acs_merchants
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Admins read threeds_acs_users" ON public.threeds_acs_users;
DROP POLICY IF EXISTS "Secops manage threeds_acs_users" ON public.threeds_acs_users;
CREATE POLICY "Admins read threeds_acs_users" ON public.threeds_acs_users
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Secops manage threeds_acs_users" ON public.threeds_acs_users
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','secops']::public.app_role[]))
  WITH CHECK (public.current_user_has_any_role(ARRAY['admin','secops']::public.app_role[]));

DROP POLICY IF EXISTS "Admins read threeds_requestor_config" ON public.threeds_requestor_config;
DROP POLICY IF EXISTS "Admins manage threeds_requestor_config" ON public.threeds_requestor_config;
CREATE POLICY "Admins read threeds_requestor_config" ON public.threeds_requestor_config
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Admins manage threeds_requestor_config" ON public.threeds_requestor_config
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Itspaid transfers scoped read" ON public.itspaid_transfers;
DROP POLICY IF EXISTS "Itspaid transfers scoped insert" ON public.itspaid_transfers;
DROP POLICY IF EXISTS "Itspaid transfers scoped update" ON public.itspaid_transfers;
CREATE POLICY "Itspaid transfers scoped read" ON public.itspaid_transfers
  FOR SELECT TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Itspaid transfers scoped insert" ON public.itspaid_transfers
  FOR INSERT TO authenticated
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin']::public.app_role[]));
CREATE POLICY "Itspaid transfers scoped update" ON public.itspaid_transfers
  FOR UPDATE TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]))
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Itspaid cards scoped read" ON public.itspaid_cards;
DROP POLICY IF EXISTS "Itspaid cards scoped insert" ON public.itspaid_cards;
DROP POLICY IF EXISTS "Itspaid cards scoped update" ON public.itspaid_cards;
CREATE POLICY "Itspaid cards scoped read" ON public.itspaid_cards
  FOR SELECT TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Itspaid cards scoped insert" ON public.itspaid_cards
  FOR INSERT TO authenticated
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin']::public.app_role[]));
CREATE POLICY "Itspaid cards scoped update" ON public.itspaid_cards
  FOR UPDATE TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]))
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Itspaid settings scoped manage" ON public.itspaid_settings;
CREATE POLICY "Itspaid settings scoped manage" ON public.itspaid_settings
  FOR ALL TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin']::public.app_role[]))
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.current_user_has_any_role(ARRAY['admin']::public.app_role[]));
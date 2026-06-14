CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_enki(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin','support','secops','super_admin']::public.app_role[])
$$;

GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_enki(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_enki(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_enki(uuid) FROM anon;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'richard.r@everpayinc.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'secops'::public.app_role
FROM auth.users
WHERE lower(email) = 'richard.r@everpayinc.com'
ON CONFLICT (user_id, role) DO NOTHING;

DROP POLICY IF EXISTS admin_read_everpay_webhooks ON public.everpay_webhooks;
CREATE POLICY admin_read_everpay_webhooks ON public.everpay_webhooks
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','secops']::public.app_role[]));

DROP POLICY IF EXISTS admin_all_3ds ON public.merchant_3ds_settings;
CREATE POLICY admin_all_3ds ON public.merchant_3ds_settings
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS admin_all_psp_routes ON public.psp_routes;
CREATE POLICY admin_all_psp_routes ON public.psp_routes
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]));

DROP POLICY IF EXISTS admin_all_notification_settings ON public.webhook_notification_settings;
CREATE POLICY admin_all_notification_settings ON public.webhook_notification_settings
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Admins read threeds_acs_merchants" ON public.threeds_acs_merchants;
DROP POLICY IF EXISTS "Admins manage threeds_acs_merchants" ON public.threeds_acs_merchants;
CREATE POLICY "Admins read threeds_acs_merchants" ON public.threeds_acs_merchants
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Admins manage threeds_acs_merchants" ON public.threeds_acs_merchants
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Admins read threeds_acs_users" ON public.threeds_acs_users;
DROP POLICY IF EXISTS "Super admins manage threeds_acs_users" ON public.threeds_acs_users;
CREATE POLICY "Admins read threeds_acs_users" ON public.threeds_acs_users
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Secops manage threeds_acs_users" ON public.threeds_acs_users
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','secops']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','secops']::public.app_role[]));

DROP POLICY IF EXISTS "Admins read threeds_requestor_config" ON public.threeds_requestor_config;
DROP POLICY IF EXISTS "Admins manage threeds_requestor_config" ON public.threeds_requestor_config;
CREATE POLICY "Admins read threeds_requestor_config" ON public.threeds_requestor_config
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Admins manage threeds_requestor_config" ON public.threeds_requestor_config
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Merchants view their itspaid transfers" ON public.itspaid_transfers;
DROP POLICY IF EXISTS "Merchants insert their itspaid transfers" ON public.itspaid_transfers;
DROP POLICY IF EXISTS "Merchants update their itspaid transfers" ON public.itspaid_transfers;
CREATE POLICY "Itspaid transfers scoped read" ON public.itspaid_transfers
  FOR SELECT TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Itspaid transfers scoped insert" ON public.itspaid_transfers
  FOR INSERT TO authenticated
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]));
CREATE POLICY "Itspaid transfers scoped update" ON public.itspaid_transfers
  FOR UPDATE TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]))
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Merchants view their itspaid cards" ON public.itspaid_cards;
DROP POLICY IF EXISTS "Merchants insert their itspaid cards" ON public.itspaid_cards;
DROP POLICY IF EXISTS "Merchants update their itspaid cards" ON public.itspaid_cards;
CREATE POLICY "Itspaid cards scoped read" ON public.itspaid_cards
  FOR SELECT TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin','support','secops']::public.app_role[]));
CREATE POLICY "Itspaid cards scoped insert" ON public.itspaid_cards
  FOR INSERT TO authenticated
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]));
CREATE POLICY "Itspaid cards scoped update" ON public.itspaid_cards
  FOR UPDATE TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]))
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin','support']::public.app_role[]));

DROP POLICY IF EXISTS "Merchants manage their itspaid settings" ON public.itspaid_settings;
CREATE POLICY "Itspaid settings scoped manage" ON public.itspaid_settings
  FOR ALL TO authenticated
  USING ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]))
  WITH CHECK ((merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())) OR public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]));
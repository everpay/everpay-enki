
-- 1. Column-level revokes for sensitive tokens/secrets
REVOKE SELECT (access_token, refresh_token) ON public.bigcommerce_stores FROM authenticated, anon;
REVOKE UPDATE (access_token, refresh_token) ON public.bigcommerce_stores FROM authenticated, anon;

REVOKE SELECT (access_token, webhook_secret, encrypted_token, iv, auth_tag) ON public.shopify_stores FROM authenticated, anon;
REVOKE UPDATE (access_token, webhook_secret, encrypted_token, iv, auth_tag) ON public.shopify_stores FROM authenticated, anon;

REVOKE SELECT (secret) ON public.webhook_endpoints FROM authenticated, anon;
REVOKE UPDATE (secret) ON public.webhook_endpoints FROM authenticated, anon;

-- 2. admin_notification_emails: include super_admin
DROP POLICY IF EXISTS admin_all_admin_notification_emails ON public.admin_notification_emails;
CREATE POLICY admin_all_admin_notification_emails ON public.admin_notification_emails
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3. settlement_batches: include super_admin
DROP POLICY IF EXISTS settlement_batches_admin_select ON public.settlement_batches;
CREATE POLICY settlement_batches_admin_select ON public.settlement_batches
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

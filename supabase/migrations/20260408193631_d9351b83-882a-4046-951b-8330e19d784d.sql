
-- 1. Fix platform_fee_markups: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can read platform_fee_markups" ON public.platform_fee_markups;

CREATE POLICY "Admins can read platform_fee_markups"
  ON public.platform_fee_markups FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- 2. Fix acquirers: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can read acquirers" ON public.acquirers;

CREATE POLICY "Admins can read acquirers"
  ON public.acquirers FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- 3. Fix email-assets bucket: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can upload to email-assets" ON storage.objects;

CREATE POLICY "Service role can upload to email-assets"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'email-assets');

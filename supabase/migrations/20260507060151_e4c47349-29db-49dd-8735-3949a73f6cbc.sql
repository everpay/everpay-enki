
-- 1. audit_logs: block client INSERT/UPDATE/DELETE; only service_role and admins may write.
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

DROP POLICY IF EXISTS "No client inserts on audit_logs" ON public.audit_logs;
CREATE POLICY "No client inserts on audit_logs"
ON public.audit_logs FOR INSERT TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates on audit_logs" ON public.audit_logs;
CREATE POLICY "No client updates on audit_logs"
ON public.audit_logs FOR UPDATE TO authenticated, anon
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes on audit_logs" ON public.audit_logs;
CREATE POLICY "No client deletes on audit_logs"
ON public.audit_logs FOR DELETE TO authenticated, anon
USING (false);

-- 2. KYB documents: add DELETE and UPDATE policies (folder-prefix scoped to owner).
DROP POLICY IF EXISTS "Users can delete own KYB documents" ON storage.objects;
CREATE POLICY "Users can delete own KYB documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kyb-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own KYB documents" ON storage.objects;
CREATE POLICY "Users can update own KYB documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kyb-documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'kyb-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can manage KYB documents" ON storage.objects;
CREATE POLICY "Admins can manage KYB documents"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'kyb-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')))
WITH CHECK (bucket_id = 'kyb-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));

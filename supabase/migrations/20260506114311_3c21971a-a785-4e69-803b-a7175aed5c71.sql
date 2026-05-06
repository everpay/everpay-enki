DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Admins can read KYB documents for review" ON storage.objects;
CREATE POLICY "Admins can read KYB documents for review"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyb-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
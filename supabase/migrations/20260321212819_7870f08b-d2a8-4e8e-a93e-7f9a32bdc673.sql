
DROP POLICY IF EXISTS "Authenticated users can view settlement batches" ON settlement_batches;

CREATE POLICY "settlement_batches_admin_select"
  ON settlement_batches FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

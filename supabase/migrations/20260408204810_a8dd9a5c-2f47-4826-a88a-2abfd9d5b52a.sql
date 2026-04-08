
-- 1. Fix risk_rules: remove merchant_id IS NULL exposure
DROP POLICY IF EXISTS "Users can view own risk rules" ON public.risk_rules;

CREATE POLICY "Users can view own risk rules"
  ON public.risk_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = risk_rules.merchant_id
        AND merchants.user_id = auth.uid()
    )
  );

-- Allow admins to see all risk rules including global ones
CREATE POLICY "Admins can view all risk rules"
  ON public.risk_rules FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- 2. Harden gateway_credentials: add admin read access
CREATE POLICY "Admins can view all gateway credentials"
  ON public.gateway_credentials FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- Admin manage policy for gateway_credentials
CREATE POLICY "Admins can manage all gateway credentials"
  ON public.gateway_credentials FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
  );

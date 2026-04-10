-- 1. Remove fee_breakdowns from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.fee_breakdowns;

-- 2. Fix user_roles SELECT policy: restrict from public to authenticated
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
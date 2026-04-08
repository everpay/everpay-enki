
-- 1. Fix routing_attempt_logs: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can read routing_attempt_logs" ON public.routing_attempt_logs;

CREATE POLICY "Admins can read routing_attempt_logs"
  ON public.routing_attempt_logs FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- 2. Fix user_roles privilege escalation: restrict INSERT to super_admin only
DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;

CREATE POLICY "Super admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. Fix user_roles DELETE: restrict to super_admin only
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Super admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 4. Fix user_roles UPDATE: restrict to super_admin only
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;

CREATE POLICY "Super admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Clean up duplicate SELECT policies on user_roles
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;

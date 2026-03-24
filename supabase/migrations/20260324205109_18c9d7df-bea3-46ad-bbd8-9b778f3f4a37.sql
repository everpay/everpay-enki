
-- Assign super_admin to existing platform users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users WHERE email IN ('support@everpayinc.com', 'everpay@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update trigger function to auto-assign super_admin for richard.r@everpayinc.com on signup
CREATE OR REPLACE FUNCTION public.assign_developer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-assign super_admin to platform owner
  IF NEW.email = 'richard.r@everpayinc.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Developer portal signups get developer role
  IF (NEW.raw_user_meta_data->>'signup_source') = 'developers' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'developer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

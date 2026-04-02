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
  IF (NEW.raw_user_meta_data->>'signup_source') = 'developers'
     OR (NEW.raw_user_meta_data->>'signup_source') = 'developer' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'developer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Reseller portal signups get reseller role
  IF (NEW.raw_user_meta_data->>'signup_source') = 'reseller'
     OR (NEW.raw_user_meta_data->>'signup_source') = 'resellers' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'reseller')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
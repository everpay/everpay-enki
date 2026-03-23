-- Add 'developer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- Create a function to auto-assign developer role on signup from developers subdomain
CREATE OR REPLACE FUNCTION public.assign_developer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the signup source is the developer portal
  IF (NEW.raw_user_meta_data->>'signup_source') = 'developers' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'developer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_developer_signup ON auth.users;
CREATE TRIGGER on_developer_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_developer_role();
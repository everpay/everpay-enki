REVOKE EXECUTE ON FUNCTION public.can_access_enki() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_enki() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_enki() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_enki() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_any_role(public.app_role[]) TO service_role;
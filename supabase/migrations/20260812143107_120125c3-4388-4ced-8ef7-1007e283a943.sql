
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.manages_house(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.my_house_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_profile_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

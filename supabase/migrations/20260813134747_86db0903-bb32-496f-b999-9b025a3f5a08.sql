REVOKE ALL ON FUNCTION public.manages_student(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manages_student(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manages_house(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manages_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_house_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_ville(uuid) TO authenticated;
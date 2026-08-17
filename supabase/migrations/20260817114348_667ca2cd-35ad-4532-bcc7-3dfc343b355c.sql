
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) END;
$$;

CREATE OR REPLACE FUNCTION public.manages_house(_user_id uuid, _house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'responsable' AND house_id IS NOT NULL AND house_id = _house_id
    ) END;
$$;

CREATE OR REPLACE FUNCTION public.manages_student(_user_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _student_id AND p.house_id IS NOT NULL AND public.manages_house(_user_id, p.house_id)
    ) END;
$$;

CREATE OR REPLACE FUNCTION public.my_ville(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN _user_id IS DISTINCT FROM auth.uid() THEN NULL
    ELSE (SELECT ville FROM public.profiles WHERE id = _user_id) END;
$$;

REVOKE ALL ON FUNCTION public.my_house_id(uuid) FROM authenticated, anon, PUBLIC;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.manages_house(uuid, uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.manages_student(uuid, uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.my_ville(uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manages_house(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manages_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_ville(uuid) TO authenticated;

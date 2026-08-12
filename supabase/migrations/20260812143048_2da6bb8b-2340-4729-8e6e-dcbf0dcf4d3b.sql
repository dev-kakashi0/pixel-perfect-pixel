
CREATE TYPE public.app_role AS ENUM ('admin', 'responsable', 'etudiant');
CREATE TYPE public.profile_status AS ENUM ('en_attente', 'valide', 'refuse');
CREATE TYPE public.house_gender AS ENUM ('garcons', 'filles');

CREATE TABLE public.houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  ville text NOT NULL,
  genre public.house_gender NOT NULL,
  capacite integer NOT NULL DEFAULT 6,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.houses TO authenticated;
GRANT ALL ON public.houses TO service_role;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  prenom text NOT NULL DEFAULT '',
  nom text NOT NULL DEFAULT '',
  age integer,
  origine text,
  faculte text,
  annee_etude text,
  house_id uuid REFERENCES public.houses(id) ON DELETE SET NULL,
  annee_integration integer,
  telephone text,
  statut public.profile_status NOT NULL DEFAULT 'en_attente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  house_id uuid REFERENCES public.houses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.manages_house(_user_id uuid, _house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'responsable' AND house_id IS NOT NULL AND house_id = _house_id
  );
$$;

CREATE OR REPLACE FUNCTION public.my_house_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT house_id FROM public.user_roles WHERE user_id = _user_id AND role = 'responsable' LIMIT 1;
$$;

CREATE POLICY "houses_select_authenticated" ON public.houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "houses_admin_insert" ON public.houses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "houses_admin_update" ON public.houses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "houses_admin_delete" ON public.houses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_select_manager" ON public.profiles FOR SELECT TO authenticated USING (house_id IS NOT NULL AND public.manages_house(auth.uid(), house_id));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_profile_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.statut := OLD.statut;
    NEW.house_id := OLD.house_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_profiles_update BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_changes();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, prenom, nom)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'nom', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'etudiant')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.houses (nom, ville, genre) VALUES
  ('Maison Lomé 1', 'Lomé', 'garcons'),
  ('Maison Lomé 2', 'Lomé', 'garcons'),
  ('Maison Lomé 3', 'Lomé', 'garcons'),
  ('Maison Lomé 4', 'Lomé', 'garcons'),
  ('Maison Lomé 5', 'Lomé', 'garcons'),
  ('Maison Lomé 6', 'Lomé', 'filles'),
  ('Maison Kara 1', 'Kara', 'garcons'),
  ('Maison Kara 2', 'Kara', 'garcons');

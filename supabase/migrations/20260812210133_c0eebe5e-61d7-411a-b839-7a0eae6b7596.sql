ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ville text;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_ville_check CHECK (ville IS NULL OR ville IN ('Lomé','Kara'));

CREATE OR REPLACE FUNCTION public.my_ville(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ville FROM public.profiles WHERE id = _user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.my_ville(uuid) FROM anon, authenticated, public;

DROP POLICY IF EXISTS "houses_select_authenticated" ON public.houses;
CREATE POLICY "houses_select_scoped" ON public.houses FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.my_ville(auth.uid()) IS NULL
  OR ville = public.my_ville(auth.uid())
);

CREATE OR REPLACE FUNCTION public.guard_profile_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.statut := OLD.statut;
    NEW.house_id := OLD.house_id;
    IF OLD.ville IS NOT NULL THEN
      NEW.ville := OLD.ville;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_changes() FROM anon, authenticated, public;

CREATE TABLE public.house_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  annee_academique text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, annee_academique)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.house_assignments TO authenticated;
GRANT ALL ON public.house_assignments TO service_role;
ALTER TABLE public.house_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assign_select_own" ON public.house_assignments FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "assign_select_admin" ON public.house_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "assign_select_manager" ON public.house_assignments FOR SELECT TO authenticated USING (public.manages_house(auth.uid(), house_id));
CREATE POLICY "assign_admin_insert" ON public.house_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "assign_admin_update" ON public.house_assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "assign_admin_delete" ON public.house_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sync_current_house()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_profile uuid;
  latest_house uuid;
BEGIN
  target_profile := COALESCE(NEW.profile_id, OLD.profile_id);
  SELECT house_id INTO latest_house
  FROM public.house_assignments
  WHERE profile_id = target_profile
  ORDER BY annee_academique DESC
  LIMIT 1;
  UPDATE public.profiles SET house_id = latest_house, updated_at = now() WHERE id = target_profile;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_current_house() FROM anon, authenticated, public;

CREATE TRIGGER house_assignments_sync
AFTER INSERT OR UPDATE OR DELETE ON public.house_assignments
FOR EACH ROW EXECUTE FUNCTION public.sync_current_house();
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND statut = 'valide')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member() TO authenticated;

DROP POLICY IF EXISTS "books_select_all" ON public.books;
CREATE POLICY "books_select_members" ON public.books FOR SELECT TO authenticated USING (public.is_active_member());

DROP POLICY IF EXISTS "Tous voient les annonces" ON public.announcements;
CREATE POLICY "Membres voient les annonces" ON public.announcements FOR SELECT TO authenticated USING (public.is_active_member());

DROP POLICY IF EXISTS "Tous voient les evenements" ON public.events;
CREATE POLICY "Membres voient les evenements" ON public.events FOR SELECT TO authenticated USING (public.is_active_member());

DROP POLICY IF EXISTS "Tous voient les annees" ON public.academic_years;
CREATE POLICY "Membres voient les annees" ON public.academic_years FOR SELECT TO authenticated USING (public.is_active_member());

DROP POLICY IF EXISTS "Membres voient les avatars" ON storage.objects;
CREATE POLICY "Membres voient les avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (owner_id = (select auth.uid()::text) OR public.is_active_member()));

DROP POLICY IF EXISTS "covers_read_auth" ON storage.objects;
CREATE POLICY "covers_read_auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'book-covers' AND public.is_active_member());
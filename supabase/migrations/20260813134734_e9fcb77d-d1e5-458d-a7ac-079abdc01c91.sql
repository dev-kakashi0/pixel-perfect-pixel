CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  auteur text,
  couverture_url text,
  pages_total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books_select_all" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_insert_admin" ON public.books FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "books_update_admin" ON public.books FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "books_delete_admin" ON public.books FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.manages_student(_user_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _student_id
      AND p.house_id IS NOT NULL
      AND public.manages_house(_user_id, p.house_id)
  );
$$;

CREATE TABLE public.book_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  ordre_lecture integer NOT NULL DEFAULT 1,
  annee_integration integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, book_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_assignments TO authenticated;
GRANT ALL ON public.book_assignments TO service_role;
ALTER TABLE public.book_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ba_select_own" ON public.book_assignments FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "ba_select_admin" ON public.book_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ba_select_manager" ON public.book_assignments FOR SELECT TO authenticated USING (public.manages_student(auth.uid(), student_id));
CREATE POLICY "ba_insert_admin" ON public.book_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ba_update_admin" ON public.book_assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ba_delete_admin" ON public.book_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.reading_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT current_date,
  pages_lues integer NOT NULL DEFAULT 0,
  motif_non_lecture text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_logs TO authenticated;
GRANT ALL ON public.reading_logs TO service_role;
ALTER TABLE public.reading_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rl_select_own" ON public.reading_logs FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "rl_select_admin" ON public.reading_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "rl_select_manager" ON public.reading_logs FOR SELECT TO authenticated USING (public.manages_student(auth.uid(), student_id));
CREATE POLICY "rl_insert_own" ON public.reading_logs FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "rl_update_own" ON public.reading_logs FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mois text NOT NULL,
  montant integer NOT NULL DEFAULT 10000,
  paye boolean NOT NULL DEFAULT false,
  coche_par uuid,
  coche_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, mois)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "co_select_own" ON public.contributions FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "co_select_admin" ON public.contributions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "co_select_manager" ON public.contributions FOR SELECT TO authenticated USING (public.manages_student(auth.uid(), student_id));
CREATE POLICY "co_insert_manager" ON public.contributions FOR INSERT TO authenticated WITH CHECK (public.manages_student(auth.uid(), student_id));
CREATE POLICY "co_insert_admin" ON public.contributions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "co_update_manager" ON public.contributions FOR UPDATE TO authenticated USING (public.manages_student(auth.uid(), student_id)) WITH CHECK (public.manages_student(auth.uid(), student_id));
CREATE POLICY "co_update_admin" ON public.contributions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "covers_read_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'book-covers');
CREATE POLICY "covers_admin_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "covers_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "covers_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));
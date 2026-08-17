CREATE TABLE public.grade_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode text,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grade_reports_student_idx ON public.grade_reports(student_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_reports TO authenticated;
GRANT ALL ON public.grade_reports TO service_role;

ALTER TABLE public.grade_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gr_select_own" ON public.grade_reports FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "gr_select_manager" ON public.grade_reports FOR SELECT TO authenticated USING (public.manages_student(auth.uid(), student_id));
CREATE POLICY "gr_select_admin" ON public.grade_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gr_insert_own" ON public.grade_reports FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "gr_delete_own" ON public.grade_reports FOR DELETE TO authenticated USING (student_id = auth.uid());
CREATE POLICY "gr_delete_admin" ON public.grade_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "gr_files_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'grade-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "gr_files_select_manager" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'grade-reports' AND public.manages_student(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gr_files_select_admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'grade-reports' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gr_files_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'grade-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "gr_files_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'grade-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
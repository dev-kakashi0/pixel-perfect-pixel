
-- 1. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('lecture','contribution','annonce')),
  lue boolean NOT NULL DEFAULT false,
  cle text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notifications_user_cle_idx ON public.notifications(user_id, cle) WHERE cle IS NOT NULL;
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir ses notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Creer ses notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Modifier ses notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Supprimer ses notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2. ANNEES ACADEMIQUES
CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX academic_years_one_active_idx ON public.academic_years(active) WHERE active;

GRANT SELECT ON public.academic_years TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous voient les annees" ON public.academic_years
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gere les annees" ON public.academic_years
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.academic_years (label, date_debut, date_fin, active) VALUES
  ('2024-2025', '2024-08-01', '2025-07-31', false),
  ('2025-2026', '2025-08-01', '2026-07-31', true),
  ('2026-2027', '2026-08-01', '2027-07-31', false);

ALTER TABLE public.house_assignments ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL;
UPDATE public.house_assignments ha SET academic_year_id = ay.id FROM public.academic_years ay WHERE ay.label = ha.annee_academique;

-- 3. ANNONCES
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  contenu text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_created_idx ON public.announcements(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous voient les annonces" ON public.announcements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gere les annonces" ON public.announcements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

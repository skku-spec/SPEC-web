CREATE TABLE IF NOT EXISTS public.curriculum_weeks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track       text NOT NULL CHECK (track IN ('learner', 'preneur', 'vcc')),
  week_number int,
  week_label  text NOT NULL,
  topic       text NOT NULL,
  objectives  text,
  assignment  text,
  notes       text,
  batch       text NOT NULL DEFAULT 'default',
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track       text NOT NULL CHECK (track IN ('preneur', 'vcc')),
  area_number text NOT NULL,
  title       text NOT NULL,
  subtitle    text,
  description text,
  activities  jsonb NOT NULL DEFAULT '[]',
  batch       text NOT NULL DEFAULT 'default',
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_curriculum_weeks_updated_at
  BEFORE UPDATE ON public.curriculum_weeks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_curriculum_areas_updated_at
  BEFORE UPDATE ON public.curriculum_areas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.curriculum_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curriculum_weeks_read_all" ON public.curriculum_weeks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "curriculum_weeks_admin_modify" ON public.curriculum_weeks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')));

ALTER TABLE public.curriculum_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curriculum_areas_read_all" ON public.curriculum_areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "curriculum_areas_admin_modify" ON public.curriculum_areas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')));

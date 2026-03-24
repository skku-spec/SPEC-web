CREATE TABLE IF NOT EXISTS public.partners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  logo_url    text NOT NULL,
  website_url text,
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_read_all" ON public.partners
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "partners_admin_modify" ON public.partners
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')));

INSERT INTO public.partners (name, logo_url, website_url, sort_order) VALUES
  ('성균관대학교 RISE 사업단', '/images/partners/rise.png', NULL, 1),
  ('카카오모빌리티', '/images/partners/kakao-mobility.png', 'https://www.kakaomobility.com', 2),
  ('SL IT', '/images/partners/sl-it.png', NULL, 3);

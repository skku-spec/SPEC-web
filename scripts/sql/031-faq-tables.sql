CREATE TABLE IF NOT EXISTS public.faq_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section       text NOT NULL,
  section_title text NOT NULL,
  question      text NOT NULL,
  answer        text NOT NULL,
  sort_order    int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_items_read_all" ON public.faq_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "faq_items_admin_modify" ON public.faq_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')));

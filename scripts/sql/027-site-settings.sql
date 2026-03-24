CREATE TABLE IF NOT EXISTS public.site_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  value       text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT 'general',
  label       text NOT NULL DEFAULT '',
  description text,
  value_type  text NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'url', 'email', 'json')),
  sort_order  int NOT NULL DEFAULT 0,
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_read_all" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_settings_admin_modify" ON public.site_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')));

INSERT INTO public.site_settings (key, value, category, label, value_type, sort_order) VALUES
  ('contact_general_email', 'specskku@gmail.com', 'contact', '일반 문의', 'email', 1),
  ('contact_apply_email', 'specskku@gmail.com', 'contact', '지원 문의', 'email', 2),
  ('contact_partnership_email', 'specskku@gmail.com', 'contact', '제휴 문의', 'email', 3),
  ('contact_press_email', 'specskku@gmail.com', 'contact', '언론 문의', 'email', 4),
  ('contact_office_address', '서울특별시 종로구 성균관로 25-2 성균관대학교', 'contact', '사무실 주소', 'string', 5),
  ('social_instagram', 'https://www.instagram.com/spec.skku/', 'social', 'Instagram', 'url', 1),
  ('social_linkedin', 'https://www.linkedin.com/company/specskku/', 'social', 'LinkedIn', 'url', 2),
  ('social_website', 'https://specskku.com', 'social', '웹사이트', 'url', 3);

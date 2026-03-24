CREATE TABLE IF NOT EXISTS public.application_form_fields (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch       text NOT NULL,
  field_name  text NOT NULL,
  label       text NOT NULL,
  description text,
  field_type  text NOT NULL DEFAULT 'textarea' CHECK (field_type IN ('text', 'textarea', 'select', 'number')),
  required    boolean NOT NULL DEFAULT true,
  min_length  int,
  max_length  int DEFAULT 5000,
  placeholder text,
  options     jsonb,
  step_number int NOT NULL DEFAULT 0,
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(batch, field_name)
);

CREATE TRIGGER set_form_fields_updated_at
  BEFORE UPDATE ON public.application_form_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.application_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_fields_read_all" ON public.application_form_fields
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "form_fields_admin_modify" ON public.application_form_fields
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur')));

INSERT INTO public.application_form_fields (batch, field_name, label, description, field_type, required, min_length, max_length, placeholder, step_number, sort_order) VALUES
  ('4', 'introduction', '자기소개', '자기소개를 작성해주세요 (50자 이상)', 'textarea', true, 50, 5000, '간단한 자기소개를 작성해주세요...', 1, 1),
  ('4', 'vision', '창업 비전', '창업에 대한 비전을 작성해주세요 (50자 이상)', 'textarea', true, 50, 5000, '창업에 대한 비전을 설명해주세요...', 1, 2),
  ('4', 'startup_idea', '창업 아이디어', '현재 진행 중이거나 구상 중인 아이디어 (50자 이상)', 'textarea', true, 50, 5000, '아이디어를 설명해주세요...', 2, 3),
  ('4', 'friday_activity', '금요일 활동 참여', '금요일 정기 활동 참여 가능 여부와 계획 (10자 이상)', 'textarea', true, 10, 5000, '참여 계획을 작성해주세요...', 2, 4),
  ('4', 'team_collaboration', '팀 역할과 협업', '팀 내 역할과 협업 경험 (50자 이상)', 'textarea', true, 50, 5000, '팀 경험을 설명해주세요...', 3, 5),
  ('4', 'additional_comments', '추가 사항', '추가로 전달하고 싶은 내용 (선택)', 'textarea', false, 1, 5000, '자유롭게 작성해주세요...', 3, 6);

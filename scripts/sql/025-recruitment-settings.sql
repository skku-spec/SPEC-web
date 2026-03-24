-- 025-recruitment-settings.sql
-- Recruitment settings table with status-driven cascade control.
-- Admin sets ONE status → banner, homepage card, /apply page, form access ALL auto-update.

-- ============================================================
-- Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recruitment_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cohort identity
  batch           text NOT NULL UNIQUE,
  batch_label     text NOT NULL,
  short_label     text NOT NULL,
  banner_label    text NOT NULL DEFAULT '',
  hero_badge      text NOT NULL DEFAULT '',

  -- Status-driven control (master field)
  status          text NOT NULL DEFAULT 'closed'
                    CHECK (status IN ('recruiting', 'reviewing', 'closed', 'upcoming')),

  -- Banner display (auto-derived from status in application code, but overrideable)
  show_banner     boolean NOT NULL DEFAULT false,

  -- Timeline steps (JSONB array)
  -- Each element: { title, date, highlight?, start: {year,month,day}, end?: {year,month,day} }
  timeline_steps  jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Auto-update updated_at trigger (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recruitment_settings_updated_at
  BEFORE UPDATE ON public.recruitment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

-- Quick lookup of active (non-closed) recruitment
CREATE INDEX idx_recruitment_settings_status
  ON public.recruitment_settings (status) WHERE status != 'closed';

-- DB-level enforcement: only ONE row can have status = 'recruiting' at a time
CREATE UNIQUE INDEX idx_one_recruiting
  ON public.recruitment_settings ((true)) WHERE status = 'recruiting';

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.recruitment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for /apply page, navbar banner, homepage card)
CREATE POLICY "Anyone can read recruitment settings"
  ON public.recruitment_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins/preneurs can modify
CREATE POLICY "Admins can manage recruitment settings"
  ON public.recruitment_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'preneur')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'preneur')
    )
  );

-- ============================================================
-- Seed: 4기 (closed — recruitment finished)
-- ============================================================
INSERT INTO public.recruitment_settings (
  batch, batch_label, short_label, banner_label, hero_badge,
  status, show_banner, timeline_steps
) VALUES (
  '4',
  'SPEC 4기 러너 (추가 모집)',
  'SPEC 4기 추가 모집',
  'SPEC 4기 러너 추가 모집 중',
  '2026 Spring · 4기 추가 모집',
  'closed',
  false,
  '[
    {"title":"1차 서류 접수","date":"3/13(금) ~ 3/16(월)","highlight":false,"start":{"year":2026,"month":3,"day":13},"end":{"year":2026,"month":3,"day":16}},
    {"title":"서류 결과 발표","date":"3/17(화)","highlight":false,"start":{"year":2026,"month":3,"day":17}},
    {"title":"2차 온라인 면접","date":"3/18(수) ~ 3/22(일)","highlight":false,"start":{"year":2026,"month":3,"day":18},"end":{"year":2026,"month":3,"day":22}},
    {"title":"최종 결과 발표","date":"3/23(월)","highlight":false,"start":{"year":2026,"month":3,"day":23}},
    {"title":"OT (필참)","date":"3/27(금)","highlight":true,"start":{"year":2026,"month":3,"day":27}}
  ]'::jsonb
);

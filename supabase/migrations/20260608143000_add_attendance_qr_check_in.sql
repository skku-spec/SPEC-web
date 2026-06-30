ALTER TABLE public.attendance_sessions
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS self_check_in_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.attendance_session_check_ins (
  session_id UUID PRIMARY KEY REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.attendance_check_in_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL,
  outcome TEXT NOT NULL
);

ALTER TABLE public.attendance_session_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_check_in_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_overridden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_method TEXT;

DO $$
BEGIN
  ALTER TABLE public.attendance_session_check_ins
    ADD CONSTRAINT attendance_session_check_ins_code_hash_check
    CHECK (code_hash ~ '^[a-f0-9]{64}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.attendance_logs
    ADD CONSTRAINT attendance_logs_source_check
    CHECK (source IN ('admin', 'self'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.attendance_logs
    ADD CONSTRAINT attendance_logs_check_in_method_check
    CHECK (check_in_method IS NULL OR check_in_method IN ('qr', 'code'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.attendance_check_in_attempts
    ADD CONSTRAINT attendance_check_in_attempts_method_check
    CHECK (method IN ('qr', 'code'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.attendance_check_in_attempts
    ADD CONSTRAINT attendance_check_in_attempts_outcome_check
    CHECK (outcome IN ('failed', 'success'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS attendance_sessions_self_check_in_idx
  ON public.attendance_sessions (self_check_in_enabled, date DESC);

CREATE INDEX IF NOT EXISTS attendance_logs_self_check_in_idx
  ON public.attendance_logs (user_id, session_id, source);

CREATE INDEX IF NOT EXISTS attendance_check_in_attempts_recent_failed_idx
  ON public.attendance_check_in_attempts (session_id, user_id, attempted_at DESC)
  WHERE outcome = 'failed';

DROP POLICY IF EXISTS "Admins/Preneurs can manage attendance check-ins" ON public.attendance_session_check_ins;
CREATE POLICY "Admins/Preneurs can manage attendance check-ins" ON public.attendance_session_check_ins
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur')
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

DROP POLICY IF EXISTS "Admins/Preneurs can manage attendance check-in attempts" ON public.attendance_check_in_attempts;
CREATE POLICY "Admins/Preneurs can manage attendance check-in attempts" ON public.attendance_check_in_attempts
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur')
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

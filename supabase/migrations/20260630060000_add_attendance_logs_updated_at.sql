ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.attendance_logs
SET updated_at = COALESCE(created_at, now())
WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_attendance_logs_updated_at ON public.attendance_logs;
CREATE TRIGGER set_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

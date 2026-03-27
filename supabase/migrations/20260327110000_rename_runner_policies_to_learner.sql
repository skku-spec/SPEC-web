-- Rename leftover "Runners" RLS policies to "Learners"
-- The conditions (user_id = auth.uid()) are unchanged — only names are updated.

-- attendance_logs
DROP POLICY IF EXISTS "Runners can view own logs" ON public.attendance_logs;
CREATE POLICY "Learners can view own logs" ON public.attendance_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- homework_submissions
DROP POLICY IF EXISTS "Runners can view own submissions" ON public.homework_submissions;
CREATE POLICY "Learners can view own submissions" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Runners can insert/update own submissions" ON public.homework_submissions;
CREATE POLICY "Learners can manage own submissions" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 024-attendance-homework-tracking.sql
-- Unified tracking for attendance and homework submissions

-- 1. Attendance Sessions (e.g., Weekly Meetup 1, 2, 3...)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Attendance Status (who is present/absent for which session)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent', -- present, absent, late, excused
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- 3. Homework Submissions (manual completion or link-based)
CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, reviewed
  submission_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(homework_id, user_id)
);

-- 4. RLS Policies
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Admins/Preneurs can do everything
CREATE POLICY "Admins/Preneurs can manage sessions" ON attendance_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur'))
  );

CREATE POLICY "Admins/Preneurs can manage logs" ON attendance_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur'))
  );

CREATE POLICY "Admins/Preneurs can manage submissions" ON homework_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'preneur'))
  );

-- Runners can read sessions
CREATE POLICY "Runners can view sessions" ON attendance_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'runner')
  );

-- Runners can view their own logs
CREATE POLICY "Runners can view own logs" ON attendance_logs
  FOR SELECT USING (user_id = auth.uid());

-- Runners can view their own submissions
CREATE POLICY "Runners can view own submissions" ON homework_submissions
  FOR SELECT USING (user_id = auth.uid());

-- Runners can create their own submissions
CREATE POLICY "Runners can insert/update own submissions" ON homework_submissions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 040-homework-section-submissions.sql
-- Per-section submission tracking: (user) x (homework) x (section_id)
-- section_id: Padlet section ID, or synthetic key for manual mode

CREATE TABLE IF NOT EXISTS homework_section_submissions (
  homework_id  UUID REFERENCES homeworks(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id   TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, homework_id, section_id)
);

ALTER TABLE homework_section_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/Preneurs can manage section submissions" ON homework_section_submissions;
DROP POLICY IF EXISTS "Runners can view own section submissions" ON homework_section_submissions;

CREATE POLICY "Admins/Preneurs can manage section submissions"
  ON homework_section_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'preneur')
    )
  );

CREATE POLICY "Runners can view own section submissions"
  ON homework_section_submissions FOR SELECT
  USING (user_id = auth.uid());

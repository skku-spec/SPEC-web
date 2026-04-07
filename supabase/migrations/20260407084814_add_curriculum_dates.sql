ALTER TABLE curriculum_weeks ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL;
ALTER TABLE curriculum_weeks ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;
COMMENT ON COLUMN curriculum_weeks.end_date IS 'Only set for multi-day events (e.g. hackathons). NULL means single-day event using start_date.';

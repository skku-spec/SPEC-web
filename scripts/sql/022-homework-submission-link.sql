-- ============================================================
-- 022-homework-submission-link.sql
-- Add submission_link column to homeworks table
-- ============================================================

ALTER TABLE public.homeworks 
ADD COLUMN IF NOT EXISTS submission_link TEXT;

-- Reload schema
NOTIFY pgrst, 'reload schema';

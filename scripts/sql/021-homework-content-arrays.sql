-- ============================================================
-- 021-homework-content-arrays.sql
-- Change homework content to JSONB for multiple tasks
-- ============================================================

ALTER TABLE public.homeworks 
ALTER COLUMN individual_content TYPE JSONB USING to_jsonb(individual_content),
ALTER COLUMN team_content TYPE JSONB USING to_jsonb(team_content);

-- Set default empty array if null
UPDATE public.homeworks SET individual_content = '[]'::jsonb WHERE individual_content IS NULL;
UPDATE public.homeworks SET team_content = '[]'::jsonb WHERE team_content IS NULL;

-- Reload schema
NOTIFY pgrst, 'reload schema';

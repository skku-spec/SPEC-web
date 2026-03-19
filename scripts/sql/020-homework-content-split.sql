-- ============================================================
-- 020-homework-content-split.sql
-- Split homework content into individual and team sections
-- ============================================================

ALTER TABLE public.homeworks 
ADD COLUMN IF NOT EXISTS individual_content TEXT,
ADD COLUMN IF NOT EXISTS team_content TEXT;

-- Migration: Copy old content to individual_content if it was individual
UPDATE public.homeworks 
SET individual_content = content 
WHERE is_individual = true AND individual_content IS NULL;

-- Reload schema
NOTIFY pgrst, 'reload schema';

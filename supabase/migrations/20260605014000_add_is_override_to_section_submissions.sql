-- 20260605014000_add_is_override_to_section_submissions.sql
-- Add is_override column to homework_section_submissions table to prevent automatic syncs from overwriting manual overrides.

ALTER TABLE public.homework_section_submissions 
ADD COLUMN IF NOT EXISTS is_override BOOLEAN NOT NULL DEFAULT false;

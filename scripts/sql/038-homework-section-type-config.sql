-- Migration: Add section_type_config to homeworks table
-- This allows admins to tag each Padlet section as 'individual' or 'team'
-- so submission matching logic can apply the correct check per section.

ALTER TABLE public.homeworks
  ADD COLUMN IF NOT EXISTS section_type_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.homeworks.section_type_config IS
  'Maps padlet section IDs to their type: {"sectionId": "individual"|"team"}. Untagged sections fall back to is_individual/is_team flags.';

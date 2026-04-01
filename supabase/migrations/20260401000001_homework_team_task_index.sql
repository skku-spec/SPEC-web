-- Migration: Add task_index to homework_team_assignments
ALTER TABLE public.homework_team_assignments
  ADD COLUMN IF NOT EXISTS task_index INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.homeworks.section_type_config IS
  'Maps padlet section IDs to config: {"sectionId": {"type": "individual"|"team", "task_index": 0}}. Untagged sections fall back to homework-level flags.';

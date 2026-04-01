-- Migration: Add task_index to homework_team_assignments
-- Allows different team compositions per team-task item within the same homework.
-- task_index corresponds to the 0-based index of the item in team_content array.
-- Existing rows default to task_index = 0 (first team task).

ALTER TABLE public.homework_team_assignments
  ADD COLUMN IF NOT EXISTS task_index INTEGER NOT NULL DEFAULT 0;

-- Update section_type_config comment to reflect new structure:
-- {"sectionId": {"type": "individual"}} or
-- {"sectionId": {"type": "team", "task_index": 0}}
COMMENT ON COLUMN public.homeworks.section_type_config IS
  'Maps padlet section IDs to config: {"sectionId": {"type": "individual"|"team", "task_index": 0}}. Untagged sections fall back to homework-level flags.';

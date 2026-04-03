ALTER TABLE public.homework_team_assignments ADD COLUMN IF NOT EXISTS task_index INTEGER NOT NULL DEFAULT 0;

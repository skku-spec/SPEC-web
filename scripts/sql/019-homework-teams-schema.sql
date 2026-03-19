-- ============================================================
-- 019-homework-teams-schema.sql
-- Update homeworks table and add team assignments
-- ============================================================

-- 1. Update homeworks table to include type flags
ALTER TABLE public.homeworks 
ADD COLUMN IF NOT EXISTS is_individual BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_team BOOLEAN DEFAULT false;

-- 2. Create homework_team_members table
-- Links users to a specific homework and a group identifier
CREATE TABLE IF NOT EXISTS public.homework_team_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id UUID REFERENCES public.homeworks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_name TEXT NOT NULL, -- Name or Identifier for the team (e.g., "Team 1")
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.homework_team_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Policies for homework_team_assignments
CREATE POLICY "Everyone can view team assignments"
    ON public.homework_team_assignments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage team assignments"
    ON public.homework_team_assignments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Grant permissions
GRANT ALL ON public.homework_team_assignments TO authenticated;

-- 6. Reload
NOTIFY pgrst, 'reload schema';

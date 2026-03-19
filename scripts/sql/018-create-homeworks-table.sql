-- ============================================================
-- 018-create-homeworks-table.sql
-- Create table for Homework management
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.homeworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- SELECT: All authenticated users (Admin, Runner, Preneur) can view homeworks
CREATE POLICY "Authenticated users can view homeworks"
    ON public.homeworks
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Only admins can create homeworks
CREATE POLICY "Only admins can insert homeworks"
    ON public.homeworks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- UPDATE: Only admins can update homeworks
CREATE POLICY "Only admins can update homeworks"
    ON public.homeworks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- DELETE: Only admins can delete homeworks
CREATE POLICY "Only admins can delete homeworks"
    ON public.homeworks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 4. Grant permissions
GRANT ALL ON public.homeworks TO authenticated;
GRANT SELECT ON public.homeworks TO anon;

-- 5. Reload PostgREST
NOTIFY pgrst, 'reload schema';

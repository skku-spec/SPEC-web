-- ============================================================
-- 017-role-migration-runner-preneur.sql
-- SPEC Role System Update: member -> runner, preneur
-- Fixes error: "invalid input value for enum user_role: 'preneur'"
-- ============================================================

-- 1. Add new enum values (runner, preneur)
-- NOTE: If your database environment (like Supabase) does not support ADD VALUE 
-- in a script combined with other commands, run these lines FIRST.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'runner';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'preneur';

-- 2. Migrate existing 'member' users to 'runner'
-- This ensures existing users don't get downgraded to 'outsider' 
-- when 'member' is eventually removed or ignored by the app.
UPDATE public.profiles 
SET role = 'runner'::public.user_role 
WHERE role::text = 'member';

-- 3. Update public.can_write() function
-- Replaces 'member' with 'runner' and 'preneur' as valid writer roles.
CREATE OR REPLACE FUNCTION public.can_write()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_user_role() IN (
    'runner'::public.user_role, 
    'preneur'::public.user_role, 
    'admin'::public.user_role
  );
$$;

-- 4. Re-grant permissions (sanity check)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_write() TO anon, authenticated;

-- 5. Reload PostgREST schema cache
-- Ensures Supabase/PostgREST notices the type and function changes immediately.
NOTIFY pgrst, 'reload schema';

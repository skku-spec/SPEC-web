-- Fix: profiles_update_self_or_admin RLS policy references broken public.is_admin() function.
-- role_system_refactor dropped get_user_role() but never recreated this policy with column-based pattern.
-- Root cause of admin role-change failures on /admin/users.

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  )
  WITH CHECK (
    auth.uid() = id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

NOTIFY pgrst, 'reload schema';

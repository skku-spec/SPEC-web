ALTER TYPE user_role RENAME VALUE 'runner' TO 'learner';

CREATE OR REPLACE FUNCTION public.can_write()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('learner', 'preneur', 'admin')
  );
$$;

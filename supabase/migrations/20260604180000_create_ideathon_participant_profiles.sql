CREATE TABLE IF NOT EXISTS public.ideathon_participant_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url       text NOT NULL CHECK (btrim(image_url) <> ''),
  department      text NOT NULL CHECK (btrim(department) <> ''),
  major           text,
  age             integer NOT NULL CHECK (age BETWEEN 15 AND 80),
  student_id      text NOT NULL CHECK (btrim(student_id) <> ''),
  grade           text NOT NULL CHECK (btrim(grade) <> ''),
  ability_tags    text[] NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(ability_tags) BETWEEN 1 AND 6),
  interest_tags   text[] NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(interest_tags) <= 5),
  startup_reason  text NOT NULL CHECK (btrim(startup_reason) <> ''),
  team_style      text NOT NULL CHECK (btrim(team_style) <> ''),
  december_goal   text NOT NULL CHECK (btrim(december_goal) <> ''),
  free_appeal     text NOT NULL CHECK (btrim(free_appeal) <> ''),
  portfolio_url   text,
  sns_url         text,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ideathon_participant_profiles_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_ideathon_participant_profiles_user
  ON public.ideathon_participant_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_ideathon_participant_profiles_published
  ON public.ideathon_participant_profiles(updated_at DESC)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ideathon_participant_profiles_ability_tags
  ON public.ideathon_participant_profiles USING gin (ability_tags);

CREATE INDEX IF NOT EXISTS idx_ideathon_participant_profiles_interest_tags
  ON public.ideathon_participant_profiles USING gin (interest_tags);

ALTER TABLE public.ideathon_participant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ideathon_participant_profiles_select" ON public.ideathon_participant_profiles;
CREATE POLICY "ideathon_participant_profiles_select" ON public.ideathon_participant_profiles
  FOR SELECT TO authenticated
  USING (
    published_at IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('learner', 'preneur')
    )
  );

DROP POLICY IF EXISTS "ideathon_participant_profiles_insert" ON public.ideathon_participant_profiles;
CREATE POLICY "ideathon_participant_profiles_insert" ON public.ideathon_participant_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('learner', 'preneur')
    )
  );

DROP POLICY IF EXISTS "ideathon_participant_profiles_update" ON public.ideathon_participant_profiles;
CREATE POLICY "ideathon_participant_profiles_update" ON public.ideathon_participant_profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('learner', 'preneur')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('learner', 'preneur')
    )
  );

DROP POLICY IF EXISTS "ideathon_participant_profiles_delete" ON public.ideathon_participant_profiles;
CREATE POLICY "ideathon_participant_profiles_delete" ON public.ideathon_participant_profiles
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('learner', 'preneur')
    )
  );

DROP TRIGGER IF EXISTS set_ideathon_participant_profiles_updated_at ON public.ideathon_participant_profiles;
CREATE TRIGGER set_ideathon_participant_profiles_updated_at
  BEFORE UPDATE ON public.ideathon_participant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

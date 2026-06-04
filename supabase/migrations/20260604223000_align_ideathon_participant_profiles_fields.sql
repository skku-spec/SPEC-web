ALTER TABLE public.ideathon_participant_profiles
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS looking_for_teammates text,
  ADD COLUMN IF NOT EXISTS appeal text;

UPDATE public.ideathon_participant_profiles
SET photo_url = image_url
WHERE photo_url IS NULL
  AND image_url IS NOT NULL;

UPDATE public.ideathon_participant_profiles
SET looking_for_teammates = '12월 데모데이까지 함께 검증하고 실행할 동료'
WHERE looking_for_teammates IS NULL;

UPDATE public.ideathon_participant_profiles
SET appeal = free_appeal
WHERE appeal IS NULL
  AND free_appeal IS NOT NULL;

ALTER TABLE public.ideathon_participant_profiles
  ALTER COLUMN photo_url SET NOT NULL,
  ALTER COLUMN looking_for_teammates SET NOT NULL;

ALTER TABLE public.ideathon_participant_profiles
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS free_appeal;

ALTER TABLE public.ideathon_participant_profiles
  DROP CONSTRAINT IF EXISTS ideathon_participant_profiles_photo_url_check,
  DROP CONSTRAINT IF EXISTS ideathon_participant_profiles_department_length_check,
  DROP CONSTRAINT IF EXISTS ideathon_participant_profiles_student_id_length_check,
  DROP CONSTRAINT IF EXISTS ideathon_participant_profiles_grade_length_check,
  DROP CONSTRAINT IF EXISTS ideathon_participant_profiles_long_text_length_check,
  DROP CONSTRAINT IF EXISTS ideathon_participant_profiles_url_length_check;

ALTER TABLE public.ideathon_participant_profiles
  ADD CONSTRAINT ideathon_participant_profiles_photo_url_check
    CHECK (btrim(photo_url) <> ''),
  ADD CONSTRAINT ideathon_participant_profiles_department_length_check
    CHECK (char_length(department) <= 80),
  ADD CONSTRAINT ideathon_participant_profiles_student_id_length_check
    CHECK (char_length(student_id) <= 20),
  ADD CONSTRAINT ideathon_participant_profiles_grade_length_check
    CHECK (char_length(grade) <= 20),
  ADD CONSTRAINT ideathon_participant_profiles_long_text_length_check
    CHECK (
      char_length(startup_reason) <= 1000
      AND char_length(team_style) <= 1000
      AND char_length(december_goal) <= 1000
      AND char_length(looking_for_teammates) <= 1000
      AND (appeal IS NULL OR char_length(appeal) <= 1000)
    ),
  ADD CONSTRAINT ideathon_participant_profiles_url_length_check
    CHECK (
      char_length(photo_url) <= 500
      AND (portfolio_url IS NULL OR char_length(portfolio_url) <= 500)
      AND (sns_url IS NULL OR char_length(sns_url) <= 500)
    );

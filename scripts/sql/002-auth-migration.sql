-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text NOT NULL DEFAULT '';

-- Add unique constraint on username (only for non-empty)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
ON public.profiles(username) WHERE username != '';

-- Update the handle_new_user trigger to use new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_name text;
  v_username text;
  v_linkedin_url text;
  v_slug_base text;
BEGIN
  v_first_name := coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'), ''), '');
  v_last_name := coalesce(nullif(trim(new.raw_user_meta_data->>'last_name'), ''), '');
  v_username := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1));
  v_linkedin_url := coalesce(nullif(trim(new.raw_user_meta_data->>'linkedin_url'), ''), '');

  -- Build display name from last + first, fallback to username, then email prefix
  v_name := trim(coalesce(nullif(trim(v_last_name || v_first_name), ''), v_username, split_part(new.email, '@', 1), '사용자'));
  v_slug_base := coalesce(nullif(public.slugify(v_username), ''), 'user');

  INSERT INTO public.profiles (
    id, name, slug, role, bio, photo, batch, company,
    username, first_name, last_name, linkedin_url
  )
  VALUES (
    new.id,
    v_name,
    v_slug_base || '-' || left(new.id::text, 8),
    'outsider',
    '', '', '', '',
    v_username, v_first_name, v_last_name, v_linkedin_url
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

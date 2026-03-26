UPDATE profiles SET profile_visibility = 'public' WHERE profile_visibility != 'public';

ALTER TABLE profiles ALTER COLUMN profile_visibility SET DEFAULT 'public';

-- --- PROFILES TABLE ---
-- Update existing names to match "LastNameFirstName" format
UPDATE profiles
SET name = COALESCE(last_name, '') || COALESCE(first_name, '')
WHERE name IS NULL OR name != COALESCE(last_name, '') || COALESCE(first_name, '');

-- Function to keep profile name in sync
CREATE OR REPLACE FUNCTION public.sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.name = COALESCE(NEW.last_name, '') || COALESCE(NEW.first_name, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_profile_name ON profiles;
CREATE TRIGGER tr_sync_profile_name
BEFORE INSERT OR UPDATE OF first_name, last_name ON profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_name();


-- --- MEMBERS TABLE ---
-- Add first_name and last_name columns to members table if the user wants them split too
ALTER TABLE members ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Initial backfill for members (best effort split for simple Korean names)
UPDATE members
SET
  last_name = SUBSTRING(name FROM 1 FOR 1),
  first_name = SUBSTRING(name FROM 2)
WHERE (first_name IS NULL OR last_name IS NULL) AND name ~ '^[가-힣]{2,4}$';

-- Function to keep member name in sync
CREATE OR REPLACE FUNCTION public.sync_member_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.name = COALESCE(NEW.last_name, '') || COALESCE(NEW.first_name, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_member_name ON members;
CREATE TRIGGER tr_sync_member_name
BEFORE INSERT OR UPDATE OF first_name, last_name ON members
FOR EACH ROW EXECUTE FUNCTION public.sync_member_name();

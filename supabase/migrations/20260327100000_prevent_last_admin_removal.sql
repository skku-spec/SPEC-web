CREATE OR REPLACE FUNCTION safe_remove_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET is_admin = false
  WHERE id = target_user_id
    AND is_admin = true
    AND (SELECT count(*) FROM profiles WHERE is_admin = true AND id <> target_user_id) >= 1;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_admin = true) THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    ELSE
      RAISE EXCEPTION 'User not found or not an admin';
    END IF;
  END IF;

  RETURN true;
END;
$$;

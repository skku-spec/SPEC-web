-- Trigger: members → profiles 이름 자동 동기화
-- member의 이름이 바뀌거나 profile이 연결될 때, 연결된 profile의 이름도 동기화

CREATE OR REPLACE FUNCTION public.sync_member_name_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- 연결된 profile이 있고, first_name/last_name이 존재할 때만 동기화
  IF NEW.public_profile_id IS NOT NULL
     AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    UPDATE profiles
    SET
      first_name = COALESCE(NEW.first_name, ''),
      last_name  = COALESCE(NEW.last_name, '')
    WHERE id = NEW.public_profile_id;
    -- profiles의 기존 tr_sync_profile_name 트리거가 name 필드를 자동 갱신
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_member_name_to_profile ON members;
CREATE TRIGGER tr_sync_member_name_to_profile
AFTER INSERT OR UPDATE OF name, first_name, last_name, public_profile_id ON members
FOR EACH ROW EXECUTE FUNCTION public.sync_member_name_to_profile();

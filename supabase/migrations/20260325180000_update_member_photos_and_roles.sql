UPDATE public.members SET photo_url = '/images/member/이송목.png' WHERE name = '이송목';
UPDATE public.members SET photo_url = '/images/member/이연서.png' WHERE name = '이연서';
UPDATE public.members SET photo_url = '/images/member/임영빈.png' WHERE name = '임영빈';
UPDATE public.members SET photo_url = '/images/member/전도현.png' WHERE name = '전도현';
UPDATE public.members SET photo_url = '/images/member/최윤정.png' WHERE name = '최윤정';
UPDATE public.members SET photo_url = '/images/member/한지상.png' WHERE name = '한지상';
UPDATE public.members SET photo_url = '/images/member/서원준.png' WHERE name = '서원준';
UPDATE public.members SET photo_url = '/images/member/신지은.png' WHERE name = '신지은';
UPDATE public.members SET photo_url = '/images/member/류영상.png' WHERE name = '류영상';
UPDATE public.members SET photo_url = '/images/member/김혜민.png' WHERE name = '김혜민';
UPDATE public.members SET photo_url = '/images/member/김동인.png' WHERE name = '김동인';
UPDATE public.members SET photo_url = '/images/member/권민재.png' WHERE name = '권민재';

UPDATE public.members
SET batch_tags = array_remove(batch_tags, '4기 회장'),
    parts = CASE
      WHEN parts IS NULL THEN ARRAY['커뮤니티']
      WHEN NOT ('커뮤니티' = ANY(parts)) THEN array_append(parts, '커뮤니티')
      ELSE parts
    END
WHERE name = '이송목';

UPDATE public.members
SET batch_tags = CASE
      WHEN batch_tags IS NULL THEN ARRAY['4기 커뮤니티 리드']
      WHEN NOT ('4기 커뮤니티 리드' = ANY(batch_tags)) THEN array_append(batch_tags, '4기 커뮤니티 리드')
      ELSE batch_tags
    END
WHERE name = '이송목';

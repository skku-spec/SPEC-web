update public.members as m
set public_profile_id = p.id
from public.profiles as p
where m.slug = 'kim-dongin'
  and m.name = '김동인'
  and m.preneur_batch = '4기'
  and m.public_profile_id is null
  and p.slug = 'user-fb5c26ab'
  and p.name = 'Dongin Kim'
  and not exists (
    select 1
    from public.members as existing
    where existing.public_profile_id = p.id
  );

update public.members as m
set public_profile_id = p.id
from public.profiles as p
where m.slug = 'kim-hyemin'
  and m.name = '김혜민'
  and m.preneur_batch = '4기'
  and m.public_profile_id is null
  and p.slug = 'kim-hyemin-748450ea'
  and p.name = 'hyemin Kim'
  and not exists (
    select 1
    from public.members as existing
    where existing.public_profile_id = p.id
  );

update public.members as m
set public_profile_id = p.id
from public.profiles as p
where m.slug = 'lee-songmok'
  and m.name = '이송목'
  and m.preneur_batch = '4기'
  and m.public_profile_id is null
  and p.slug = 'finepine-294e600e'
  and p.name = 'Songmok Lee'
  and not exists (
    select 1
    from public.members as existing
    where existing.public_profile_id = p.id
  );

update public.members as m
set public_profile_id = p.id
from public.profiles as p
where m.slug = 'jeon-dohyun'
  and m.name = '전도현'
  and m.preneur_batch = '4기'
  and m.public_profile_id is null
  and p.slug = 'max-a66a7b05'
  and p.name = 'Dohyun Jeon'
  and not exists (
    select 1
    from public.members as existing
    where existing.public_profile_id = p.id
  );

update public.members as m
set public_profile_id = p.id
from public.profiles as p
where m.slug = 'choi-yunjeong'
  and m.name = '최윤정'
  and m.preneur_batch = '4기'
  and m.public_profile_id is null
  and p.slug = 'user-7dc688a5'
  and p.name = 'YUNJEONG CHOI'
  and not exists (
    select 1
    from public.members as existing
    where existing.public_profile_id = p.id
  );

update public.members as m
set public_profile_id = p.id
from public.profiles as p
where m.slug = 'han-jisang'
  and m.name = '한지상'
  and m.preneur_batch = '4기'
  and m.public_profile_id is null
  and p.slug = 'jsap-c32d3216'
  and p.name = 'Jisang Han'
  and not exists (
    select 1
    from public.members as existing
    where existing.public_profile_id = p.id
  );

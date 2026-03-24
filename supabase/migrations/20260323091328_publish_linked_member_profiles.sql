update public.profiles
set profile_visibility = 'public'
where id in (
  select distinct public_profile_id
  from public.members
  where preneur_batch = '4기'
    and public_profile_id is not null
)
  and profile_visibility <> 'public';

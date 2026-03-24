alter table public.members
  add column if not exists public_profile_id uuid
  references public.profiles(id) on delete set null;

create unique index if not exists idx_members_public_profile_id_unique
  on public.members(public_profile_id)
  where public_profile_id is not null;

create index if not exists idx_members_public_profile_id
  on public.members(public_profile_id)
  where public_profile_id is not null;

notify pgrst, 'reload schema';

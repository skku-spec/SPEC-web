do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_visibility') then
    create type public.profile_visibility as enum ('private', 'public');
  end if;
end
$$;

alter table public.profiles
  add column if not exists headline text not null default '',
  add column if not exists "current_role" text not null default '',
  add column if not exists website_url text not null default '',
  add column if not exists brunch_url text not null default '',
  add column if not exists github_url text not null default '',
  add column if not exists profile_visibility public.profile_visibility not null default 'private';

alter table public.profiles
  drop constraint if exists profiles_headline_length,
  drop constraint if exists profiles_current_role_length,
  drop constraint if exists profiles_bio_length;

alter table public.profiles
  add constraint profiles_headline_length check (char_length(headline) <= 80),
  add constraint profiles_current_role_length check (char_length("current_role") <= 50),
  add constraint profiles_bio_length check (char_length(bio) <= 600);

create unique index if not exists idx_profiles_slug_lower_unique
  on public.profiles (lower(slug));

create table if not exists public.profile_experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization text not null,
  title text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text not null default '',
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_experiences_organization_not_blank check (length(trim(organization)) > 0),
  constraint profile_experiences_title_not_blank check (length(trim(title)) > 0),
  constraint profile_experiences_description_length check (char_length(description) <= 300),
  constraint profile_experiences_date_order check (
    start_date is null
    or end_date is null
    or end_date >= start_date
  ),
  constraint profile_experiences_current_end_date check (
    (is_current = true and end_date is null)
    or is_current = false
  )
);

create unique index if not exists idx_profile_experiences_profile_sort_order
  on public.profile_experiences(profile_id, sort_order);

create index if not exists idx_profile_experiences_profile_id
  on public.profile_experiences(profile_id);

create index if not exists idx_posts_author_published_type_created_at
  on public.posts(author_id, published, type, created_at desc);

create or replace function public.is_public_author_profile(
  input_role public.user_role,
  input_visibility public.profile_visibility
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select input_role in ('member'::public.user_role, 'admin'::public.user_role)
    and input_visibility = 'public'::public.profile_visibility;
$$;

create or replace function public.can_manage_public_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    auth.uid() = target_profile_id
    and public.can_write()
  ) or public.is_admin();
$$;

grant execute on function public.is_public_author_profile(public.user_role, public.profile_visibility) to anon, authenticated;
grant execute on function public.can_manage_public_profile(uuid) to authenticated;

drop trigger if exists set_profile_experiences_updated_at on public.profile_experiences;
create trigger set_profile_experiences_updated_at
before update on public.profile_experiences
for each row
execute procedure public.set_updated_at();

alter table public.profile_experiences enable row level security;

drop policy if exists "profile_experiences_read_public_or_owner_or_admin" on public.profile_experiences;
create policy "profile_experiences_read_public_or_owner_or_admin"
  on public.profile_experiences for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_experiences.profile_id
        and (
          public.is_public_author_profile(p.role, p.profile_visibility)
          or public.can_manage_public_profile(p.id)
        )
    )
  );

drop policy if exists "profile_experiences_insert_owner_or_admin" on public.profile_experiences;
create policy "profile_experiences_insert_owner_or_admin"
  on public.profile_experiences for insert
  to authenticated
  with check (public.can_manage_public_profile(profile_id));

drop policy if exists "profile_experiences_update_owner_or_admin" on public.profile_experiences;
create policy "profile_experiences_update_owner_or_admin"
  on public.profile_experiences for update
  to authenticated
  using (public.can_manage_public_profile(profile_id))
  with check (public.can_manage_public_profile(profile_id));

drop policy if exists "profile_experiences_delete_owner_or_admin" on public.profile_experiences;
create policy "profile_experiences_delete_owner_or_admin"
  on public.profile_experiences for delete
  to authenticated
  using (public.can_manage_public_profile(profile_id));

notify pgrst, 'reload schema';

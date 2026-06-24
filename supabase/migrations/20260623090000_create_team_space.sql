-- Team Space: startup team management, CTAs, and office-hour records.

create table if not exists public.startup_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '',
  batch text not null default '4',
  lead_preneur_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.startup_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.startup_teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_in_team text not null default '',
  created_at timestamptz not null default now(),
  unique (team_id, profile_id)
);

create table if not exists public.team_ctas (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.startup_teams(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'blocked')),
  progress_note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.office_hours (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.startup_teams(id) on delete cascade,
  held_at date not null default current_date,
  next_due_at date,
  summary text not null default '',
  decisions text not null default '',
  next_actions text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.office_hour_attendees (
  id uuid primary key default gen_random_uuid(),
  office_hour_id uuid not null references public.office_hours(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (office_hour_id, profile_id)
);

create index if not exists startup_teams_lead_preneur_id_idx on public.startup_teams(lead_preneur_id);
create index if not exists startup_team_members_team_id_idx on public.startup_team_members(team_id);
create index if not exists startup_team_members_profile_id_idx on public.startup_team_members(profile_id);
create index if not exists team_ctas_team_id_idx on public.team_ctas(team_id);
create index if not exists team_ctas_status_due_date_idx on public.team_ctas(status, due_date);
create index if not exists office_hours_team_id_held_at_idx on public.office_hours(team_id, held_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists startup_teams_touch_updated_at on public.startup_teams;
create trigger startup_teams_touch_updated_at
before update on public.startup_teams
for each row execute function public.touch_updated_at();

drop trigger if exists team_ctas_touch_updated_at on public.team_ctas;
create trigger team_ctas_touch_updated_at
before update on public.team_ctas
for each row execute function public.touch_updated_at();

drop trigger if exists office_hours_touch_updated_at on public.office_hours;
create trigger office_hours_touch_updated_at
before update on public.office_hours
for each row execute function public.touch_updated_at();

create or replace function public.is_team_space_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (role = 'preneur' or is_admin = true)
  );
$$;

create or replace function public.is_startup_team_member(input_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.startup_team_members
    where team_id = input_team_id
      and profile_id = auth.uid()
  );
$$;

alter table public.startup_teams enable row level security;
alter table public.startup_team_members enable row level security;
alter table public.team_ctas enable row level security;
alter table public.office_hours enable row level security;
alter table public.office_hour_attendees enable row level security;

drop policy if exists "team space members can read teams" on public.startup_teams;
create policy "team space members can read teams"
on public.startup_teams for select
using (public.is_team_space_admin() or public.is_startup_team_member(id));

drop policy if exists "team space admins manage teams" on public.startup_teams;
create policy "team space admins manage teams"
on public.startup_teams for all
using (public.is_team_space_admin())
with check (public.is_team_space_admin());

drop policy if exists "team space members can read memberships" on public.startup_team_members;
create policy "team space members can read memberships"
on public.startup_team_members for select
using (public.is_team_space_admin() or profile_id = auth.uid() or public.is_startup_team_member(team_id));

drop policy if exists "team space admins manage memberships" on public.startup_team_members;
create policy "team space admins manage memberships"
on public.startup_team_members for all
using (public.is_team_space_admin())
with check (public.is_team_space_admin());

drop policy if exists "team space members can read ctas" on public.team_ctas;
create policy "team space members can read ctas"
on public.team_ctas for select
using (public.is_team_space_admin() or public.is_startup_team_member(team_id));

drop policy if exists "team space admins insert ctas" on public.team_ctas;
create policy "team space admins insert ctas"
on public.team_ctas for insert
with check (public.is_team_space_admin());

drop policy if exists "team space members update ctas" on public.team_ctas;
create policy "team space members update ctas"
on public.team_ctas for update
using (public.is_team_space_admin() or public.is_startup_team_member(team_id))
with check (public.is_team_space_admin() or public.is_startup_team_member(team_id));

drop policy if exists "team space admins delete ctas" on public.team_ctas;
create policy "team space admins delete ctas"
on public.team_ctas for delete
using (public.is_team_space_admin());

drop policy if exists "team space members can read office hours" on public.office_hours;
create policy "team space members can read office hours"
on public.office_hours for select
using (public.is_team_space_admin() or public.is_startup_team_member(team_id));

drop policy if exists "team space admins manage office hours" on public.office_hours;
create policy "team space admins manage office hours"
on public.office_hours for all
using (public.is_team_space_admin())
with check (public.is_team_space_admin());

drop policy if exists "team space members can read office hour attendees" on public.office_hour_attendees;
create policy "team space members can read office hour attendees"
on public.office_hour_attendees for select
using (
  public.is_team_space_admin()
  or exists (
    select 1
    from public.office_hours oh
    where oh.id = office_hour_id
      and public.is_startup_team_member(oh.team_id)
  )
);

drop policy if exists "team space admins manage office hour attendees" on public.office_hour_attendees;
create policy "team space admins manage office hour attendees"
on public.office_hour_attendees for all
using (public.is_team_space_admin())
with check (public.is_team_space_admin());

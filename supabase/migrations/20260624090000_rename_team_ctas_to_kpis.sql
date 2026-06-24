-- Team Space KPI model: replace two-week CTAs with measurable KPIs.

do $$
begin
  if to_regclass('public.team_kpis') is null and to_regclass('public.team_ctas') is not null then
    alter table public.team_ctas rename to team_kpis;
  end if;
end $$;

create table if not exists public.team_kpis (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.startup_teams(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '',
  owner_id uuid references public.profiles(id) on delete set null,
  period_start date,
  period_end date,
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  unit text not null default '',
  status text not null default 'planned',
  progress_note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_kpis' and column_name = 'assignee_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_kpis' and column_name = 'owner_id'
  ) then
    alter table public.team_kpis rename column assignee_id to owner_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_kpis' and column_name = 'due_date'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_kpis' and column_name = 'period_end'
  ) then
    alter table public.team_kpis rename column due_date to period_end;
  end if;
end $$;

alter table if exists public.team_kpis
  add column if not exists period_start date,
  add column if not exists target_value numeric not null default 0,
  add column if not exists current_value numeric not null default 0,
  add column if not exists unit text not null default '',
  drop constraint if exists team_ctas_status_check,
  drop constraint if exists team_kpis_status_check,
  add constraint team_kpis_status_check check (status in ('planned', 'in_progress', 'achieved', 'missed', 'blocked'));

update public.team_kpis
set status = case status
  when 'todo' then 'planned'
  when 'doing' then 'in_progress'
  when 'done' then 'achieved'
  else status
end
where status in ('todo', 'doing', 'done');

create index if not exists team_kpis_team_id_idx on public.team_kpis(team_id);
create index if not exists team_kpis_status_period_end_idx on public.team_kpis(status, period_end);

drop trigger if exists team_ctas_touch_updated_at on public.team_kpis;
drop trigger if exists team_kpis_touch_updated_at on public.team_kpis;
create trigger team_kpis_touch_updated_at
before update on public.team_kpis
for each row execute function public.touch_updated_at();

alter table public.team_kpis enable row level security;

drop policy if exists "team space members can read ctas" on public.team_kpis;
drop policy if exists "team space admins insert ctas" on public.team_kpis;
drop policy if exists "team space members update ctas" on public.team_kpis;
drop policy if exists "team space admins delete ctas" on public.team_kpis;

drop policy if exists "team space members can read kpis" on public.team_kpis;
create policy "team space members can read kpis"
on public.team_kpis for select
using (public.is_team_space_admin() or public.is_startup_team_member(team_id));

drop policy if exists "team space admins insert kpis" on public.team_kpis;
create policy "team space admins insert kpis"
on public.team_kpis for insert
with check (public.is_team_space_admin());

drop policy if exists "team space members update kpis" on public.team_kpis;
create policy "team space members update kpis"
on public.team_kpis for update
using (public.is_team_space_admin() or public.is_startup_team_member(team_id))
with check (public.is_team_space_admin() or public.is_startup_team_member(team_id));

drop policy if exists "team space admins delete kpis" on public.team_kpis;
create policy "team space admins delete kpis"
on public.team_kpis for delete
using (public.is_team_space_admin());

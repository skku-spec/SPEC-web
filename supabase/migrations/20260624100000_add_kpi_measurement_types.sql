-- Team Space KPI measurement types and checklist payloads.

alter table if exists public.team_kpis
  add column if not exists measurement_type text not null default 'numeric',
  add column if not exists start_value numeric,
  add column if not exists is_measured boolean not null default false,
  add column if not exists checklist_items jsonb not null default '[]'::jsonb,
  drop constraint if exists team_kpis_measurement_type_check,
  add constraint team_kpis_measurement_type_check check (measurement_type in ('numeric', 'reduce', 'checklist'));

update public.team_kpis
set is_measured = current_value > 0
where is_measured = false;

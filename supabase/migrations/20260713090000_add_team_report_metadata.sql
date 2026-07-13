-- Report metadata for Team Space generated feed posts.

alter table if exists public.team_review_posts
  add column if not exists report_type text not null default 'free_review',
  add column if not exists round_number integer,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists published_to_feed boolean not null default true,
  add column if not exists source_id uuid;

alter table if exists public.team_review_posts
  drop constraint if exists team_review_posts_report_type_check,
  add constraint team_review_posts_report_type_check
    check (report_type in ('cta', 'coffee_chat', 'free_review'));

create index if not exists team_review_posts_report_type_idx
on public.team_review_posts(report_type);

create index if not exists team_review_posts_team_id_period_idx
on public.team_review_posts(team_id, period_start desc, created_at desc);

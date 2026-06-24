-- Team Building KPI review posts.

create table if not exists public.team_review_posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.startup_teams(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  content text not null default '',
  kpi_ids uuid[] not null default '{}',
  image_urls text[] not null default '{}',
  file_attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_review_posts_team_id_created_at_idx on public.team_review_posts(team_id, created_at desc);
create index if not exists team_review_posts_author_id_idx on public.team_review_posts(author_id);

drop trigger if exists team_review_posts_touch_updated_at on public.team_review_posts;
create trigger team_review_posts_touch_updated_at
before update on public.team_review_posts
for each row execute function public.touch_updated_at();

alter table public.team_review_posts enable row level security;

drop policy if exists "team space members can read review posts" on public.team_review_posts;
create policy "team space members can read review posts"
on public.team_review_posts for select
using (public.is_team_space_admin() or public.is_startup_team_member(team_id));

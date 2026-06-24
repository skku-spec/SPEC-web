-- Ordered content blocks for Team Building KPI review posts.

alter table if exists public.team_review_posts
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

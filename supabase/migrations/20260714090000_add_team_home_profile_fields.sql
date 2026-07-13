-- Team profile fields for Team Building 2026 Home.

alter table if exists public.startup_teams
  add column if not exists tagline text not null default '',
  add column if not exists hero_image_url text not null default '',
  add column if not exists stage text not null default '',
  add column if not exists problem text not null default '',
  add column if not exists solution text not null default '',
  add column if not exists target_customer text not null default '',
  add column if not exists core_value text not null default '';

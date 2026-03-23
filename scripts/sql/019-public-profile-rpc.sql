create or replace function public.save_public_profile(
  input_profile_id uuid,
  input_name text,
  input_headline text,
  input_current_role text,
  input_company text,
  input_bio text,
  input_linkedin_url text,
  input_website_url text,
  input_brunch_url text,
  input_github_url text,
  input_profile_visibility public.profile_visibility,
  input_experiences jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  experience jsonb;
  incoming_ids uuid[];
begin
  if not public.can_manage_public_profile(input_profile_id) then
    raise exception 'Not allowed to save public profile';
  end if;

  update public.profiles
  set
    name = input_name,
    headline = input_headline,
    "current_role" = input_current_role,
    company = input_company,
    bio = input_bio,
    linkedin_url = input_linkedin_url,
    website_url = input_website_url,
    brunch_url = input_brunch_url,
    github_url = input_github_url,
    profile_visibility = input_profile_visibility,
    updated_at = now()
  where id = input_profile_id;

  select coalesce(array_agg((item->>'id')::uuid), '{}'::uuid[])
  into incoming_ids
  from jsonb_array_elements(input_experiences) as item
  where coalesce(item->>'id', '') <> '';

  delete from public.profile_experiences
  where profile_id = input_profile_id
    and not (id = any(incoming_ids));

  for experience in
    select value
    from jsonb_array_elements(input_experiences)
  loop
    if coalesce(experience->>'id', '') <> '' then
      update public.profile_experiences
      set
        organization = experience->>'organization',
        title = experience->>'title',
        start_date = nullif(experience->>'startDate', '')::date,
        end_date = nullif(experience->>'endDate', '')::date,
        is_current = coalesce((experience->>'isCurrent')::boolean, false),
        description = coalesce(experience->>'description', ''),
        sort_order = coalesce((experience->>'sortOrder')::integer, 0),
        updated_at = now()
      where id = (experience->>'id')::uuid
        and profile_id = input_profile_id;
    else
      insert into public.profile_experiences (
        profile_id,
        organization,
        title,
        start_date,
        end_date,
        is_current,
        description,
        sort_order
      ) values (
        input_profile_id,
        experience->>'organization',
        experience->>'title',
        nullif(experience->>'startDate', '')::date,
        nullif(experience->>'endDate', '')::date,
        coalesce((experience->>'isCurrent')::boolean, false),
        coalesce(experience->>'description', ''),
        coalesce((experience->>'sortOrder')::integer, 0)
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.save_public_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.profile_visibility,
  jsonb
) to authenticated;

notify pgrst, 'reload schema';

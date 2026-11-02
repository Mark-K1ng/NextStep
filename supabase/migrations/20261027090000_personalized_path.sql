-- Bookmarks express interest; progress and explicit goals remain independent.
alter table public.user_favorites drop constraint if exists user_favorites_item_type_check;
alter table public.user_favorites add constraint user_favorites_item_type_check
  check (item_type in ('school','specialization','university','program','career','course','skill'));

create table public.user_bookmark_imports (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  imported_at timestamptz not null default now()
);
create table public.user_personalization (
  user_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null default 1 check (version = 1),
  answers jsonb not null default '{}' check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 4096),
  status text not null default 'draft' check (status in ('draft','completed','skipped')),
  cursor integer not null default 0 check (cursor between 0 and 5),
  revision integer not null default 0,
  onboarding_required boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, version)
);
create table public.user_recommendation_decisions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('school','program','university','career','course','skill')),
  item_id uuid not null,
  decision text not null check (decision in ('accepted','dismissed')),
  algorithm_version text not null check (length(algorithm_version) between 1 and 40),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
alter table public.user_bookmark_imports enable row level security;
alter table public.user_personalization enable row level security;
alter table public.user_recommendation_decisions enable row level security;
revoke all on public.user_bookmark_imports, public.user_personalization, public.user_recommendation_decisions from anon, authenticated;
grant select on public.user_bookmark_imports, public.user_personalization, public.user_recommendation_decisions to authenticated;
create policy own_imports on public.user_bookmark_imports for select to authenticated using ((select auth.uid()) = user_id);
create policy own_personalization on public.user_personalization for select to authenticated using ((select auth.uid()) = user_id);
create policy own_decisions on public.user_recommendation_decisions for select to authenticated using ((select auth.uid()) = user_id);

-- Existing accounts can opt in. New accounts see the questionnaire after signup.
insert into public.user_personalization(user_id, status) select id, 'skipped' from public.profiles;
create function public.initialize_personalization() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_personalization(user_id, onboarding_required) values (new.id, true) on conflict do nothing;
  return new;
end $$;
create trigger initialize_personalization after insert on public.profiles for each row execute function public.initialize_personalization();

-- One-time preservation of the previous bookmark/path coupling. Never repeat
-- this backfill after a bookmark is removed and never modify existing progress.
insert into public.user_favorites(user_id,item_id,item_type)
select user_id,ref_id,step_type from public.user_progress
union select user_id,career_id,'career' from public.user_goals
on conflict do nothing;

create function public.catalogue_reference_exists(kind text, ref uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return case kind
    when 'school' then exists(select 1 from public.schools where id=ref)
    when 'specialization' then exists(select 1 from public.school_profiles where id=ref)
    when 'university' then exists(select 1 from public.universities where id=ref)
    when 'program' then exists(select 1 from public.programs where id=ref)
    when 'career' then exists(select 1 from public.careers where id=ref)
    when 'course' then exists(select 1 from public.courses where id=ref)
    when 'skill' then exists(select 1 from public.skills where id=ref)
    else false end;
end $$;
create function public.import_local_bookmarks(items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare entry jsonb; principal uuid := auth.uid();
begin
  if principal is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items)>2000 then raise exception 'Invalid import'; end if;
  insert into public.user_bookmark_imports(user_id) values(principal) on conflict do nothing;
  if not found then return; end if;
  for entry in select value from jsonb_array_elements(items) loop
    if public.catalogue_reference_exists(entry->>'item_type',(entry->>'item_id')::uuid) then
      insert into public.user_favorites(user_id,item_id,item_type)
      values(principal,(entry->>'item_id')::uuid,entry->>'item_type') on conflict do nothing;
    end if;
  end loop;
end $$;
create function public.save_personalization(expected_revision integer, responses jsonb, new_status text, next_cursor integer)
returns public.user_personalization language plpgsql security definer set search_path = '' as $$
declare result public.user_personalization; entry record; allowed text[]; max_choices int;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if responses is null or jsonb_typeof(responses)<>'object' or octet_length(responses::text)>4096 then raise exception 'Invalid responses'; end if;
  for entry in select * from jsonb_each(responses) loop
    allowed := case entry.key
      when 'domains' then array['technology','science','business','arts','people','engineering','unknown']
      when 'subjects' then array['math','informatics','science','languages','social','arts','unknown']
      when 'activities' then array['solve','create','help','organize','build','unknown']
      when 'language' then array['ro','en','either','unknown']
      when 'budget' then array['free','any','unknown']
      when 'pace' then array['explore','practice','study','unknown']
      else null end;
    max_choices := case when entry.key in ('domains','subjects') then 3 when entry.key='activities' then 2 else 1 end;
    if allowed is null or jsonb_typeof(entry.value)<>'array' then raise exception 'Invalid question'; end if;
    if jsonb_array_length(entry.value)>max_choices or exists(select 1 from jsonb_array_elements_text(entry.value) v where not v=any(allowed))
      or (entry.value ? 'unknown' and jsonb_array_length(entry.value)>1)
      or (select count(*) <> count(distinct value) from jsonb_array_elements_text(entry.value)) then raise exception 'Invalid choices'; end if;
  end loop;
  insert into public.user_personalization(user_id) values(auth.uid()) on conflict do nothing;
  update public.user_personalization set answers=responses, status=new_status, cursor=next_cursor,
    revision=revision+1, onboarding_required=case when new_status in ('completed','skipped') then false else onboarding_required end,
    updated_at=now()
    where user_id=auth.uid() and version=1 and revision=expected_revision returning * into result;
  if not found then raise exception 'Responses changed on another device. Reload before editing.' using errcode='40001'; end if;
  return result;
end $$;
create function public.decide_recommendation(kind text, ref uuid, choice text, algorithm text) returns void
language plpgsql security definer set search_path = '' as $$
declare grade text; region text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.catalogue_reference_exists(kind,ref) then raise exception 'Unavailable option'; end if;
  select grade_level,county into grade,region from public.profiles where id=auth.uid();
  if choice='accepted' then
    if kind='school' and (grade not in ('V','VI','VII','VIII') or not exists(select 1 from public.schools where id=ref and county=region)) then raise exception 'Option outside current stage or county'; end if;
    if kind in ('program','university') and grade not in ('XI','XII','student') then raise exception 'Option outside current stage'; end if;
    if kind='program' and not exists(select 1 from public.programs p join public.universities u on u.id=p.university_id where p.id=ref and u.county=region and p.degree_level='bachelor') then raise exception 'Option outside current county or study level'; end if;
    if kind='university' and not exists(select 1 from public.universities where id=ref and county=region) then raise exception 'Option outside current county'; end if;
    if kind='career' then
      insert into public.user_goals(user_id,career_id) values(auth.uid(),ref);
    else
      insert into public.user_progress(user_id,step_type,ref_id,status) values(auth.uid(),kind,ref,'in_progress') on conflict(user_id,step_type,ref_id) do nothing;
    end if;
  end if;
  insert into public.user_recommendation_decisions(user_id,item_type,item_id,decision,algorithm_version)
    values(auth.uid(),kind,ref,choice,algorithm) on conflict(user_id,item_type,item_id)
    do update set decision=excluded.decision,algorithm_version=excluded.algorithm_version,updated_at=now();
end $$;
create function public.reset_dismissed_recommendations() returns void language sql security definer set search_path = '' as $$
  delete from public.user_recommendation_decisions where user_id=auth.uid() and decision='dismissed';
$$;
create function public.set_bookmark(kind text, ref uuid, selected boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if selected then
    if not public.catalogue_reference_exists(kind,ref) then raise exception 'Unavailable option'; end if;
    insert into public.user_favorites(user_id,item_type,item_id) values(auth.uid(),kind,ref) on conflict do nothing;
  else
    delete from public.user_favorites where user_id=auth.uid() and item_type=kind and item_id=ref;
  end if;
end $$;
revoke all on function public.set_bookmark(text,uuid,boolean) from public,anon;
grant execute on function public.set_bookmark(text,uuid,boolean) to authenticated;
revoke all on function public.initialize_personalization(),public.catalogue_reference_exists(text,uuid),public.import_local_bookmarks(jsonb),public.save_personalization(integer,jsonb,text,integer),public.decide_recommendation(text,uuid,text,text),public.reset_dismissed_recommendations() from public,anon;
grant execute on function public.import_local_bookmarks(jsonb),public.save_personalization(integer,jsonb,text,integer),public.decide_recommendation(text,uuid,text,text),public.reset_dismissed_recommendations() to authenticated;

-- Account kind is initial signup intent, captured once into private authority.
-- No existing profile, progress, bookmark, booking or provider data is deleted.
create schema if not exists account_private;
revoke all on schema account_private from public, anon, authenticated, service_role;
alter default privileges in schema account_private revoke execute on functions from public;

create table account_private.identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_kind text not null check (account_kind in ('student','teacher')),
  created_at timestamptz not null default now()
);
create table account_private.teacher_applications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reference text not null unique default replace(gen_random_uuid()::text,'-','')
    check(reference ~ '^[0-9a-f]{32}$'),
  expires_at timestamptz not null default now()+interval '30 days',
  status text not null default 'draft'
    check(status in ('draft','submitted','under_review','approved','rejected','suspended')),
  response_reference text unique check(length(response_reference) between 1 and 300),
  received_at timestamptz,
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  review_reason text check(length(review_reason)<=500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table account_private.executive_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  added_at timestamptz not null default now()
);
create table account_private.teacher_review_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  application_reference text not null,
  decision text not null,
  response_reference text,
  reviewer_id uuid references auth.users(id) on delete set null,
  review_reason text,
  created_at timestamptz not null default now()
);
alter table account_private.identities enable row level security;
alter table account_private.teacher_applications enable row level security;
alter table account_private.executive_reviewers enable row level security;
alter table account_private.teacher_review_events enable row level security;
revoke all on all tables in schema account_private from public,anon,authenticated,service_role;
revoke all on all sequences in schema account_private from public,anon,authenticated,service_role;

-- Existing accounts remain students, except tutors with an existing trusted approval.
insert into account_private.identities(user_id,account_kind)
select u.id,case when exists(select 1 from public.tutor_profiles t
  where t.user_id=u.id and t.status='approved') then 'teacher' else 'student' end
from auth.users u;
insert into account_private.teacher_applications(user_id,status,received_at,reviewed_at,response_reference)
select t.user_id,'approved',t.created_at,t.updated_at,'legacy-approved:'||t.id::text
from public.tutor_profiles t where t.status='approved';

create function account_private.keep_account_kind() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.user_id is distinct from old.user_id or new.account_kind is distinct from old.account_kind then
    raise exception 'Account kind is fixed' using errcode='42501';
  end if;
  return new;
end $$;
create trigger fixed_account_kind before update on account_private.identities
for each row execute function account_private.keep_account_kind();

-- Teachers have shared account identity without invented student grade/location.
alter table public.profiles alter column grade_level drop not null;
alter table public.profiles alter column county drop not null;
create function account_private.validate_profile_kind() returns trigger
language plpgsql security definer set search_path='' as $$
declare kind text;
begin
  select account_kind into kind from account_private.identities where user_id=new.id;
  if kind is null then raise exception 'Account identity required' using errcode='42501'; end if;
  if kind='student' then
    if new.grade_level is null or new.county is null then
      raise exception 'Student grade and county required' using errcode='23514';
    end if;
  elsif tg_op='INSERT' then
    if new.grade_level is not null or new.county is not null or new.sector is not null
      or cardinality(new.interests)>0 or cardinality(new.favorite_subjects)>0 then
      raise exception 'Teacher account does not use student profile fields' using errcode='23514';
    end if;
  elsif new.grade_level is distinct from old.grade_level or new.county is distinct from old.county
    or new.sector is distinct from old.sector or new.interests is distinct from old.interests
    or new.favorite_subjects is distinct from old.favorite_subjects then
    raise exception 'Teacher student-profile fields are read only' using errcode='42501';
  end if;
  return new;
end $$;
create trigger validate_account_profile before insert or update on public.profiles
for each row execute function account_private.validate_profile_kind();
-- Retain normal owner upsert/edit fields; no client authority column is introduced.
revoke insert,update on public.profiles from anon,authenticated;
grant insert(id,display_name,grade_level,county,sector,interests,favorite_subjects,updated_at),
  update(display_name,grade_level,county,sector,interests,favorite_subjects,updated_at)
  on public.profiles to authenticated;

create or replace function public.initialize_personalization() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from account_private.identities where user_id=new.id and account_kind='student') then
    insert into public.user_personalization(user_id,onboarding_required)
      values(new.id,true) on conflict do nothing;
  end if;
  return new;
end $$;

create function account_private.initialize_account() returns trigger
language plpgsql security definer set search_path='' as $$
declare kind text; account_name text;
begin
  kind:=case when new.raw_user_meta_data->>'account_kind'='teacher' then 'teacher' else 'student' end;
  insert into account_private.identities(user_id,account_kind) values(new.id,kind);
  if kind='teacher' then
    account_name:=left(coalesce(nullif(trim(new.raw_user_meta_data->'nextstep_profile_pending'->>'display_name'),''),
      nullif(split_part(coalesce(new.email,''),'@',1),''),'Profesor'),100);
    insert into public.profiles(id,display_name,grade_level,county,sector,interests,favorite_subjects)
      values(new.id,account_name,null,null,null,'{}','{}');
  end if;
  return new;
end $$;
-- The retired profile-fabrication trigger must not race identity capture.
-- It was already removed in 20261026215341; repeat defensively for older deployments.
drop trigger if exists on_auth_user_created on auth.users;
create trigger aaa_initialize_account_identity after insert on auth.users
for each row execute function account_private.initialize_account();

create function account_private.account_access(principal uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare kind text; application account_private.teacher_applications; tutor public.tutor_profiles; state text;
begin
  select account_kind into kind from account_private.identities where user_id=principal;
  if kind is null then raise exception 'Account identity unavailable' using errcode='42501'; end if;
  select * into application from account_private.teacher_applications where user_id=principal;
  select * into tutor from public.tutor_profiles where user_id=principal;
  state:=case when kind='student' then 'not_started' when tutor.status='suspended' then 'suspended'
    else coalesce(application.status,case when tutor.status='approved' then 'approved' end,'not_started') end;
  return jsonb_build_object('account_kind',kind,'teacher_status',state,
    'can_teach',kind='teacher' and state='approved' and coalesce(tutor.status='approved',false),
    'application_reference',case when kind='teacher' then application.reference end,
    'application_expires_at',case when kind='teacher' then application.expires_at end,
    'application_received_at',case when kind='teacher' then application.received_at end,
    'review_reason',case when kind='teacher' then application.review_reason end);
end $$;
create function public.get_account_access() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  return account_private.account_access(auth.uid());
end $$;
create function public.start_teacher_application() returns jsonb
language plpgsql security definer set search_path='' as $$
declare principal uuid:=auth.uid(); application account_private.teacher_applications;
begin
  if principal is null or not exists(select 1 from auth.users where id=principal and email_confirmed_at is not null) then
    raise exception 'Verified account required' using errcode='42501';
  end if;
  perform 1 from account_private.identities where user_id=principal and account_kind='teacher' for update;
  if not found then raise exception 'Teacher account required' using errcode='42501'; end if;
  select * into application from account_private.teacher_applications where user_id=principal for update;
  if application.status in ('approved','suspended') or exists(select 1 from public.tutor_profiles where user_id=principal and status='suspended') then
    raise exception 'Application cannot be restarted in this state' using errcode='42501';
  end if;
  if application.user_id is null then
    insert into account_private.teacher_applications(user_id) values(principal);
  elsif application.status='rejected' or (application.status='draft' and application.expires_at<=now()) then
    update account_private.teacher_applications set reference=replace(gen_random_uuid()::text,'-',''),
      expires_at=now()+interval '30 days',status='draft',response_reference=null,received_at=null,
      reviewed_at=null,reviewer_id=null,review_reason=null,updated_at=now() where user_id=principal;
  end if;
  return account_private.account_access(principal);
end $$;

-- Manual administrative operation, intentionally absent from public RPC schema.
-- Only a trusted postgres connection may execute it after verifying a real form response.
create function account_private.review_teacher_application(
  application_reference text,decision text,response_reference text,reviewer_id uuid,reason text default null
) returns void language plpgsql security definer set search_path='' as $$
declare application account_private.teacher_applications; tutor public.tutor_profiles;
begin
  if not exists(select 1 from account_private.executive_reviewers r
    where r.user_id=reviewer_id and r.enabled) then
    raise exception 'Named executive reviewer required' using errcode='42501';
  end if;
  if decision is null or decision not in ('submitted','under_review','approved','rejected','suspended')
    or response_reference is null or length(trim(response_reference)) not between 1 and 300
    or length(coalesce(reason,''))>500 then raise exception 'Invalid review decision'; end if;
  select * into application from account_private.teacher_applications a
    where a.reference=application_reference for update;
  if application.user_id is null or not exists(select 1 from account_private.identities
    where user_id=application.user_id and account_kind='teacher') then
    raise exception 'Teacher application unavailable';
  end if;
  if application.received_at is null and application.expires_at<=now() then
    raise exception 'Application reference expired';
  end if;
  if application.response_reference is not null and application.response_reference<>trim(response_reference) then
    raise exception 'Response does not match received application';
  end if;
  if decision in ('rejected','suspended') and nullif(trim(reason),'') is null then
    raise exception 'Applicant-facing reason required';
  end if;
  if application.status='suspended' and decision not in ('approved','rejected','suspended') then
    raise exception 'Suspended account requires an executive decision';
  end if;
  select * into tutor from public.tutor_profiles where user_id=application.user_id for update;
  if decision='approved' then
    if tutor.id is null or length(trim(tutor.biography))<40 or length(trim(tutor.experience))<5
      or length(trim(tutor.qualifications))<5 or cardinality(tutor.levels)=0
      or not tutor.commission_accepted or not exists(select 1 from public.tutor_subjects where tutor_id=tutor.id) then
      raise exception 'Reviewed public tutor profile, subjects and commission acceptance required';
    end if;
  end if;
  update account_private.teacher_applications a set status=decision,
    response_reference=trim(review_teacher_application.response_reference),
    received_at=coalesce(a.received_at,now()),reviewed_at=now(),
    reviewer_id=review_teacher_application.reviewer_id,
    review_reason=nullif(trim(reason),''),updated_at=now()
    where a.user_id=application.user_id;
  if tutor.id is not null then
    update public.tutor_profiles set status=decision,updated_at=now() where id=tutor.id;
  end if;
  insert into account_private.teacher_review_events(user_id,application_reference,decision,response_reference,reviewer_id,review_reason)
    values(application.user_id,application_reference,decision,trim(response_reference),reviewer_id,nullif(trim(reason),''));
end $$;

-- Legacy in-app applications cannot bypass the external receipt/review workflow.
create or replace function tutoring_private.tutoring_save_application(p_data jsonb,p_submit boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
begin
  raise exception 'Use the verified external teacher application and executive review workflow' using errcode='42501';
end $$;

create function public.update_teacher_availability(slots jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare principal uuid:=auth.uid(); tutor public.tutor_profiles; entry jsonb;
begin
  if principal is null or not exists(select 1 from account_private.identities
    where user_id=principal and account_kind='teacher') then
    raise exception 'Approved teacher required' using errcode='42501';
  end if;
  select * into tutor from public.tutor_profiles where user_id=principal for update;
  if tutor.id is null or tutor.status<>'approved' or not exists(select 1 from account_private.teacher_applications
    where user_id=principal and status='approved') then
    raise exception 'Approved teacher required' using errcode='42501';
  end if;
  if slots is null or jsonb_typeof(slots)<>'array' or jsonb_array_length(slots)>21 then
    raise exception 'Invalid availability';
  end if;
  for entry in select value from jsonb_array_elements(slots) loop
    if jsonb_typeof(entry)<>'object' or not(entry ?& array['weekday','start_minute','end_minute'])
      or (entry-array['weekday','start_minute','end_minute'])<>'{}'::jsonb
      or jsonb_typeof(entry->'weekday')<>'number' or jsonb_typeof(entry->'start_minute')<>'number'
      or jsonb_typeof(entry->'end_minute')<>'number'
      or (entry->>'weekday') !~ '^[0-6]$' or (entry->>'start_minute') !~ '^[0-9]{1,4}$'
      or (entry->>'end_minute') !~ '^[0-9]{1,4}$' then raise exception 'Invalid availability row'; end if;
    -- Bounds, hour alignment and overlap are also enforced by existing table constraints.
    if (entry->>'start_minute')::integer not between 0 and 1380
      or (entry->>'end_minute')::integer not between 60 and 1440
      or (entry->>'start_minute')::integer%60<>0 or (entry->>'end_minute')::integer%60<>0
      or (entry->>'start_minute')::integer >= (entry->>'end_minute')::integer then
      raise exception 'Invalid availability hours';
    end if;
  end loop;
  delete from public.tutor_availability where tutor_id=tutor.id;
  for entry in select value from jsonb_array_elements(slots) loop
    insert into public.tutor_availability(tutor_id,weekday,start_minute,end_minute)
      values(tutor.id,(entry->>'weekday')::integer,(entry->>'start_minute')::integer,(entry->>'end_minute')::integer);
  end loop;
  return (select coalesce(jsonb_agg(jsonb_build_object('weekday',a.weekday,'start_minute',a.start_minute,
    'end_minute',a.end_minute) order by a.weekday,a.start_minute),'[]'::jsonb)
    from public.tutor_availability a where a.tutor_id=tutor.id);
end $$;

-- Definer RPCs bypass RLS. Guard writes at the table boundary as well as in UI.
-- Historical data belonging to approved tutors is preserved, but preview cannot edit it.
create function account_private.require_student_write() returns trigger
language plpgsql security definer set search_path='' as $$
declare principal uuid;
begin
  if tg_op='DELETE' then
    principal:=old.user_id;
    -- Preserve account deletion cascades and trusted maintenance of historical rows.
    if auth.uid() is null or not exists(select 1 from auth.users where id=principal) then return old; end if;
  else principal:=new.user_id;
  end if;
  if not exists(select 1 from account_private.identities where user_id=principal and account_kind='student') then
    raise exception 'Student account required for this action' using errcode='42501';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
do $$ declare relation text;
begin
  foreach relation in array array['user_skills','user_goals','user_progress','user_favorites',
    'user_personalization','user_recommendation_decisions','user_bookmark_imports','user_bookmark_removals'] loop
    execute format('create trigger student_account_writes before insert or update or delete on public.%I for each row execute function account_private.require_student_write()',relation);
  end loop;
end $$;

-- The paid reservation path runs with service credentials, so check its explicit principal.
alter function public.tutoring_reserve(uuid,uuid,text,timestamptz,uuid) set schema account_private;
create function public.tutoring_reserve(p_student uuid,p_tutor uuid,p_subject text,p_start timestamptz,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from account_private.identities where user_id=p_student and account_kind='student') then
    raise exception 'Student account required to book' using errcode='42501';
  end if;
  return account_private.tutoring_reserve(p_student,p_tutor,p_subject,p_start,p_id);
end $$;

revoke all on all functions in schema account_private from public,anon,authenticated,service_role;
revoke all on function public.get_account_access(),public.start_teacher_application(),public.update_teacher_availability(jsonb)
  from public,anon;
grant execute on function public.get_account_access(),public.start_teacher_application(),public.update_teacher_availability(jsonb)
  to authenticated;
revoke all on function public.tutoring_reserve(uuid,uuid,text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.tutoring_reserve(uuid,uuid,text,timestamptz,uuid) to service_role;
revoke all on function public.initialize_personalization() from public,anon,authenticated;

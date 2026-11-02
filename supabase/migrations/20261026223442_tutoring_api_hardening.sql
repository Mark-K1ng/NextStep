-- Definer implementations live outside the exposed API schema; wrappers preserve the caller.
grant usage on schema tutoring_private to authenticated;
alter default privileges in schema tutoring_private revoke execute on functions from public;
alter function public.tutoring_discover(text,text,integer,integer,uuid) set schema tutoring_private;
alter function public.tutoring_my_application() set schema tutoring_private;
alter function public.tutoring_save_application(jsonb,boolean) set schema tutoring_private;
alter function public.tutoring_slots(uuid) set schema tutoring_private;
alter function public.tutoring_lessons(boolean,integer) set schema tutoring_private;
alter function public.tutoring_reviews(uuid,integer) set schema tutoring_private;
alter function public.tutoring_review(uuid,integer,text) set schema tutoring_private;
alter function public.tutoring_complete(uuid) set schema tutoring_private;
create function public.tutoring_discover(p_search text default '',p_subject text default '',p_offset integer default 0,p_limit integer default 21,p_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$ select tutoring_private.tutoring_discover(p_search,p_subject,p_offset,p_limit,p_id); $$;
create function public.tutoring_my_application() returns jsonb language sql stable security invoker set search_path='' as $$ select tutoring_private.tutoring_my_application(); $$;
create function public.tutoring_save_application(p_data jsonb,p_submit boolean default false) returns uuid language sql security invoker set search_path='' as $$ select tutoring_private.tutoring_save_application(p_data,p_submit); $$;
create function public.tutoring_slots(p_tutor uuid) returns table(starts_at timestamptz) language sql stable security invoker set search_path='' as $$ select * from tutoring_private.tutoring_slots(p_tutor); $$;
create function public.tutoring_lessons(p_teacher boolean default false,p_offset integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$ select tutoring_private.tutoring_lessons(p_teacher,p_offset); $$;
create function public.tutoring_reviews(p_tutor uuid,p_offset integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$ select tutoring_private.tutoring_reviews(p_tutor,p_offset); $$;
create function public.tutoring_review(p_booking uuid,p_rating integer,p_comment text) returns void language sql security invoker set search_path='' as $$ select tutoring_private.tutoring_review(p_booking,p_rating,p_comment); $$;
create function public.tutoring_complete(p_booking uuid) returns void language sql security invoker set search_path='' as $$ select tutoring_private.tutoring_complete(p_booking); $$;
revoke all on function public.tutoring_discover(text,text,integer,integer,uuid),public.tutoring_my_application(),public.tutoring_save_application(jsonb,boolean),public.tutoring_slots(uuid),public.tutoring_lessons(boolean,integer),public.tutoring_reviews(uuid,integer),public.tutoring_review(uuid,integer,text),public.tutoring_complete(uuid) from public,anon;
grant execute on function public.tutoring_discover(text,text,integer,integer,uuid),public.tutoring_my_application(),public.tutoring_save_application(jsonb,boolean),public.tutoring_slots(uuid),public.tutoring_lessons(boolean,integer),public.tutoring_reviews(uuid,integer),public.tutoring_review(uuid,integer,text),public.tutoring_complete(uuid) to authenticated;

-- Explicit deny policies document the RPC-only boundary and protect future accidental table grants.
do $$ declare entry record;
begin
 for entry in select schemaname,tablename from pg_tables where (schemaname='public' and tablename in ('tutor_profiles','tutor_subjects','tutor_availability','tutoring_bookings','tutor_reviews','external_classrooms')) or schemaname='tutoring_private' loop
 execute format('create policy client_direct_access_denied on %I.%I as restrictive for all to anon,authenticated using(false) with check(false)',entry.schemaname,entry.tablename);
 end loop;
end $$;

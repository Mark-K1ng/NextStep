-- Exercise the exact client upsert as authenticated, with rollback-only fixtures.
begin;
set local statement_timeout = '15s';
do $$
declare
  student_a uuid := gen_random_uuid();
  student_b uuid := gen_random_uuid();
  teacher uuid := gen_random_uuid();
  skill uuid;
  n integer;
begin
  select id into strict skill from public.skills limit 1;
  insert into auth.users(id,aud,role,email_confirmed_at,raw_user_meta_data)
  values (student_a,'authenticated','authenticated',now(),'{"account_kind":"student"}'),
    (student_b,'authenticated','authenticated',now(),'{"account_kind":"student"}'),
    (teacher,'authenticated','authenticated',now(),'{"account_kind":"teacher","nextstep_profile_pending":{"display_name":"Skill test teacher"}}');
  insert into public.profiles(id,display_name,grade_level,county,interests,favorite_subjects)
  values (student_a,'Skill test A','XI','Bihor','{}','{}'),
    (student_b,'Skill test B','XI','Bihor','{}','{}');
  insert into public.user_skills(user_id,skill_id,level) values(student_b,skill,1);

  perform set_config('request.jwt.claim.sub',student_a::text,true);
  set local role authenticated;
  insert into public.user_skills(user_id,skill_id,level) values(student_a,skill,1)
    on conflict(user_id,skill_id) do update set user_id=excluded.user_id,skill_id=excluded.skill_id,level=excluded.level;
  insert into public.user_skills(user_id,skill_id,level) values(student_a,skill,2)
    on conflict(user_id,skill_id) do update set user_id=excluded.user_id,skill_id=excluded.skill_id,level=excluded.level;
  select count(*) into n from public.user_skills where user_id=student_a and skill_id=skill and level=2;
  if n<>1 then raise exception 'Owner assessment did not persist'; end if;
  begin
    insert into public.user_skills(user_id,skill_id,level) values(student_b,skill,3);
    raise exception 'Cross-account insert allowed';
  exception when insufficient_privilege then null; end;
  update public.user_skills set level=3 where user_id=student_b;
  get diagnostics n = row_count;
  if n<>0 then raise exception 'Cross-account update allowed'; end if;
  delete from public.user_skills where user_id=student_b;
  get diagnostics n = row_count;
  if n<>0 then raise exception 'Cross-account delete allowed'; end if;
  begin
    update public.user_skills set level=4 where user_id=student_a and skill_id=skill;
    raise exception 'Invalid assessment level allowed';
  exception when check_violation then null; end;
  delete from public.user_skills where user_id=student_a and skill_id=skill;
  get diagnostics n = row_count;
  if n<>1 then raise exception 'Owner could not clear assessment'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub',teacher::text,true);
  set local role authenticated;
  begin
    insert into public.user_skills(user_id,skill_id,level) values(teacher,skill,1);
    raise exception 'Teacher wrote student assessment';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  begin
    insert into public.user_skills(user_id,skill_id,level) values(student_a,skill,1);
    raise exception 'Anonymous assessment write allowed';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;
select 'owner insert/update/clear, isolation, student boundary and level validation passed' as result;
rollback;

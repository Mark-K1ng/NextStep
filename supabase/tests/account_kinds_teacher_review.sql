-- Run after fixed_account_kinds_teacher_review in a trusted test/SQL session.
-- Synthetic accounts and all mutations below are rolled back, including reviewer grants.
begin;
create temporary table account_kind_baseline on commit drop as
select 'profiles'::text relation,count(*) total from public.profiles
union all select 'progress',count(*) from public.user_progress
union all select 'favorites',count(*) from public.user_favorites
union all select 'bookings',count(*) from public.tutoring_bookings;

do $$
declare student uuid:=gen_random_uuid(); teacher uuid:=gen_random_uuid(); reviewer uuid:=gen_random_uuid();
  tid uuid:=gen_random_uuid(); reference text; access jsonb; slots jsonb; count_before bigint;
begin
  insert into auth.users(id,aud,role,email_confirmed_at,raw_user_meta_data)
  values(student,'authenticated','authenticated',now(),'{"account_kind":"student"}'),
    (teacher,'authenticated','authenticated',now(),'{"account_kind":"teacher","nextstep_profile_pending":{"display_name":"Synthetic teacher"}}'),
    (reviewer,'authenticated','authenticated',now(),'{}');
  insert into public.profiles(id,display_name,grade_level,county,sector,interests,favorite_subjects)
    values(student,'Synthetic student','XI','Bihor',null,'{}','{}');
  if not exists(select 1 from public.profiles where id=teacher and grade_level is null and county is null
    and display_name='Synthetic teacher') then raise exception 'Teacher requires fake student profile'; end if;
  if exists(select 1 from public.user_personalization where user_id=teacher) then
    raise exception 'Teacher was enrolled in student personalization';
  end if;
  if not exists(select 1 from public.user_personalization where user_id=student and onboarding_required) then
    raise exception 'Student onboarding changed';
  end if;
  if has_schema_privilege('authenticated','account_private','usage')
    or has_function_privilege('authenticated','account_private.review_teacher_application(text,text,text,uuid,text)','execute')
    or has_function_privilege('service_role','account_private.review_teacher_application(text,text,text,uuid,text)','execute')
    or has_table_privilege('authenticated','account_private.identities','insert,update') then
    raise exception 'Private role/review authority exposed';
  end if;

  perform set_config('request.jwt.claim.sub',student::text,true);
  set local role authenticated;
  access:=public.get_account_access();
  if access->>'account_kind'<>'student' or (access->>'can_teach')::boolean then
    raise exception 'Student access changed';
  end if;
  begin perform public.start_teacher_application(); raise exception 'Student started teacher application';
    exception when insufficient_privilege then null; end;
  begin perform public.tutoring_lessons(true); raise exception 'Student read teacher lessons';
    exception when insufficient_privilege then null; end;
  perform public.tutoring_lessons(false);
  begin perform public.tutoring_save_application('{}',true); raise exception 'Legacy student application accepted';
    exception when insufficient_privilege then null; end;
  reset role;
  -- Editable auth metadata cannot convert a previously created student identity.
  update auth.users set raw_user_meta_data='{"account_kind":"teacher"}' where id=student;
  set local role authenticated;
  if public.get_account_access()->>'account_kind'<>'student' then raise exception 'Metadata converted student'; end if;
  update public.profiles set display_name='Synthetic student edited' where id=student;
  begin update public.profiles set grade_level=null where id=student;
    raise exception 'Student null grade accepted'; exception when check_violation then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',teacher::text,true);
  set local role authenticated;
  access:=public.start_teacher_application(); reference:=access->>'application_reference';
  if reference !~ '^[0-9a-f]{32}$' or access->>'teacher_status'<>'draft'
    or access->>'application_received_at' is not null or (access->>'can_teach')::boolean then
    raise exception 'Opening form fabricated receipt or approval';
  end if;
  if public.start_teacher_application()->>'application_reference'<>reference then
    raise exception 'Duplicate start rotated live reference';
  end if;
  update public.profiles set display_name='Synthetic teacher edited' where id=teacher;
  begin update public.profiles set grade_level='XI',county='Bihor' where id=teacher;
    raise exception 'Teacher modified student profile'; exception when insufficient_privilege then null; end;
  begin insert into public.user_skills(user_id,skill_id,level) values(teacher,gen_random_uuid(),1);
    raise exception 'Teacher created student skill'; exception when insufficient_privilege then null; end;
  begin insert into public.user_goals(user_id,career_id) values(teacher,gen_random_uuid());
    raise exception 'Teacher created student goal'; exception when insufficient_privilege then null; end;
  begin insert into public.user_progress(user_id,step_type,ref_id,status) values(teacher,'skill',gen_random_uuid(),'in_progress');
    raise exception 'Teacher created student progress'; exception when insufficient_privilege then null; end;
  begin perform public.save_personalization(0,'{}','skipped',0,teacher);
    raise exception 'Teacher completed student questionnaire'; exception when insufficient_privilege then null; end;
  begin perform public.set_bookmark('skill',gen_random_uuid(),false,teacher);
    raise exception 'Teacher wrote student bookmark'; exception when insufficient_privilege then null; end;
  begin perform public.update_teacher_availability('[]'); raise exception 'Unapproved availability edited';
    exception when insufficient_privilege then null; end;
  begin perform public.tutoring_lessons(true); raise exception 'Unapproved teacher read lessons';
    exception when insufficient_privilege then null; end;
  begin perform account_private.review_teacher_application(reference,'approved','synthetic-response',teacher);
    raise exception 'Applicant reviewed own application'; exception when insufficient_privilege then null; end;
  reset role;

  begin perform account_private.review_teacher_application(reference,'approved','synthetic-response',reviewer);
    raise exception 'Unlisted executive reviewed application'; exception when insufficient_privilege then null; end;
  insert into account_private.executive_reviewers(user_id) values(reviewer);
  begin perform account_private.review_teacher_application(reference,'approved','synthetic-response',reviewer);
    raise exception 'Approval without reviewed public profile accepted';
    exception when raise_exception then if sqlerrm='Approval without reviewed public profile accepted' then raise; end if; end;
  insert into public.tutor_profiles(id,user_id,display_name,biography,experience,qualifications,levels,commission_accepted)
    values(tid,teacher,'Synthetic teacher','Synthetic reviewed biography used only inside a rolled back test.',
      'Synthetic teaching experience','Synthetic verified qualifications',array['XI'],true);
  insert into public.tutor_subjects(tutor_id,subject,price_minor)
    select tid,name,10000 from public.tutoring_subjects order by name limit 1;
  perform account_private.review_teacher_application(reference,'submitted','synthetic-response',reviewer);
  perform account_private.review_teacher_application(reference,'approved','synthetic-response',reviewer);
  set local role authenticated;
  access:=public.get_account_access();
  if access->>'teacher_status'<>'approved' or not (access->>'can_teach')::boolean then
    raise exception 'Executive approval did not enable teacher';
  end if;
  perform public.tutoring_lessons(true);
  begin perform public.tutoring_lessons(false); raise exception 'Teacher entered student lesson perspective';
    exception when insufficient_privilege then null; end;
  slots:=public.update_teacher_availability('[{"weekday":1,"start_minute":600,"end_minute":720}]');
  if slots<>'[{"weekday":1,"start_minute":600,"end_minute":720}]'::jsonb then
    raise exception 'Availability projection differs';
  end if;
  begin perform public.update_teacher_availability('[{"weekday":1,"start_minute":600,"end_minute":720},{"weekday":1,"start_minute":660,"end_minute":780}]');
    raise exception 'Overlapping availability accepted'; exception when exclusion_violation then null; end;
  begin perform public.update_teacher_availability('[{"weekday":7,"start_minute":600,"end_minute":720}]');
    raise exception 'Invalid weekday accepted';
    exception when raise_exception then if sqlerrm='Invalid weekday accepted' then raise; end if; end;
  if public.get_account_access()->>'teacher_status'<>'approved' then raise exception 'Availability revoked approval'; end if;
  reset role;
  if (select count(*) from public.tutor_availability where tutor_id=tid)<>1 then
    raise exception 'Failed availability update deleted previous slots';
  end if;
  set local role service_role;
  begin perform public.tutoring_reserve(teacher,tid,'Matematică',now()+interval '2 days',gen_random_uuid());
    raise exception 'Teacher booked as student'; exception when insufficient_privilege then null; end;
  reset role;
  perform account_private.review_teacher_application(reference,'suspended','synthetic-response',reviewer,'Synthetic review suspension');
  set local role authenticated;
  if (public.get_account_access()->>'can_teach')::boolean then raise exception 'Suspension retained teacher access'; end if;
  begin perform public.tutoring_lessons(true); raise exception 'Suspended teacher retained classroom links';
    exception when insufficient_privilege then null; end;
  begin perform public.update_teacher_availability('[]'); raise exception 'Suspended teacher edited availability';
    exception when insufficient_privilege then null; end;
  reset role;
  -- Cascade deletion still works even with teacher JWT claims present.
  delete from auth.users where id=teacher;
  if exists(select 1 from account_private.identities where user_id=teacher)
    or exists(select 1 from account_private.teacher_applications where user_id=teacher) then
    raise exception 'Teacher account deletion left private identity';
  end if;
  delete from auth.users where id in(student,reviewer);
  select total into count_before from account_kind_baseline where relation='profiles';
  if (select count(*) from public.profiles)<>count_before then raise exception 'Profile fixtures survived cleanup'; end if;
  select total into count_before from account_kind_baseline where relation='progress';
  if (select count(*) from public.user_progress)<>count_before then raise exception 'Existing progress changed'; end if;
  select total into count_before from account_kind_baseline where relation='favorites';
  if (select count(*) from public.user_favorites)<>count_before then raise exception 'Existing favorites changed'; end if;
  select total into count_before from account_kind_baseline where relation='bookings';
  if (select count(*) from public.tutoring_bookings)<>count_before then raise exception 'Existing bookings changed'; end if;
end $$;
rollback;
select 'PASS: fixed kinds, student onboarding, teacher signup, role isolation, reference idempotency, manual approval, availability atomicity, suspension, booking denial and deletion; all fixtures rolled back' result;

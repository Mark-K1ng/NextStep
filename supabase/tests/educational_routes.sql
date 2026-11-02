-- Only synthetic accounts; run inside a transaction and roll everything back.
begin;
do $$ declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); t uuid:=gen_random_uuid(); intake uuid:=gen_random_uuid(); begin
  perform set_config('test.education_a',a::text,true);
  perform set_config('test.education_b',b::text,true);
  perform set_config('test.education_t',t::text,true);
  perform set_config('test.education_intake',intake::text,true);
  perform set_config('test.education_b_intake',gen_random_uuid()::text,true);
  insert into auth.users(id,email,created_at,raw_user_meta_data) values
    (a,a||'@example.invalid',now(),jsonb_build_object('nextstep_guest_intake',intake)),
    (b,b||'@example.invalid',now(),jsonb_build_object('nextstep_guest_intake',current_setting('test.education_b_intake'))),
    (t,t||'@example.invalid',now(),'{"account_kind":"teacher"}');
  insert into public.profiles(id,display_name,grade_level,county,interests,favorite_subjects) values
    (a,'Education fixture A','VIII','Bihor','{}','{}'),(b,'Education fixture B','student','Bihor','{}','{}');
  update public.user_personalization set answers='{"domains":["arts"],"budget":["free"]}' where user_id=a;
  if has_table_privilege('authenticated','public.user_education','update') or has_table_privilege('anon','public.user_education','select') then raise exception 'Unexpected direct grants'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.education_a'),true);
do $$ declare a uuid:=current_setting('test.education_a')::uuid; b uuid:=current_setting('test.education_b')::uuid; d public.user_education; r public.user_exploration_activities; failed boolean; candidates jsonb; begin
  d:=public.get_education(a);
  if d.responses->'interests'->'answers'->'domains'<>'["arts"]' or d.responses->'practical'->'answers'->'budget'<>'["free"]' or d.responses->'interests'->>'status'<>'draft' or d.responses ? 'work' then raise exception 'Legacy migration changed meaning'; end if;
  d:=public.import_education_intake(a,current_setting('test.education_intake')::uuid,'{"interests":{"domains":["technology"],"activities":["solve"]}}');
  if d.responses->'interests'->'answers'->'domains'<>'["arts"]' or d.responses->'interests'->'answers'->'activities'<>'["solve"]' then raise exception 'Import overwrote existing answers or lost new answers'; end if;
  if (public.import_education_intake(a,current_setting('test.education_intake')::uuid,'{}')).revision<>d.revision then raise exception 'Import not idempotent'; end if;
  failed:=false; begin perform public.get_education(b); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Cross-account RPC allowed'; end if;
  failed:=false; begin perform public.save_education_questionnaire(a,d.revision-1,'work','{}','[]',0,false); exception when sqlstate 'PT409' then failed:=true; end;
  if not failed then raise exception 'Stale revision allowed'; end if;
  failed:=false; begin perform public.save_education_questionnaire(a,d.revision,'interests','{"domains":["unknown","arts"]}','[]',0,false); exception when others then failed:=true; end;
  if not failed then raise exception 'Contradictory choices accepted'; end if;
  failed:=false; begin perform public.save_education_questionnaire(a,d.revision,'work','{}','[]',0,true); exception when others then failed:=true; end;
  if not failed then raise exception 'Unvisited questionnaire completed'; end if;
  d:=public.save_education_questionnaire(a,d.revision,'work','{"environment":["unknown"]}','["collaboration","format"]',2,true);
  if d.responses->'work'->>'status'<>'completed' or d.responses->'work'->'skipped'<>'["collaboration","format"]' then raise exception 'Skip/unknown distinction lost'; end if;
  r:=public.save_exploration_activity(a,'arts:try','arts','accepted',null,'{"id":"arts:try","directionId":"arts","title":"Synthetic activity","text":"Original accepted task","minutes":10}');
  r:=public.save_exploration_activity(a,'arts:try','arts','completed','more','{"id":"arts:try","directionId":"arts","text":"Replacement must not overwrite"}',r.revision);
  if r.proposal->>'text'<>'Original accepted task' or r.reflection<>'more' then raise exception 'Accepted proposal changed'; end if;
  d:=public.save_education_questionnaire(a,d.revision,'interests','{}','[]',0,false,true);
  if not exists(select 1 from public.user_exploration_activities where user_id=a and status='completed') then raise exception 'Clearing answers deleted progress'; end if;
  candidates:=public.education_candidates(a,array['Arte']);
  if jsonb_array_length(candidates->'candidates')>720 or exists(select 1 from jsonb_array_elements(candidates->'candidates') c where c->>'type' in ('school','university','program') and c->>'county'<>'Bihor') then raise exception 'Candidate bound or Bihor boundary failed'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.education_b'),true);
do $$ declare d public.user_education; failed boolean:=false; begin
  d:=public.get_education(current_setting('test.education_b')::uuid);
  d:=public.import_education_intake(current_setting('test.education_b')::uuid,current_setting('test.education_b_intake')::uuid,'{"interests":{"domains":["technology"],"subjects":["math"],"activities":["build"]}}');
  if d.responses->'interests'->>'status'<>'completed' then raise exception 'Full intake required duplicate completion'; end if;
  if exists(select 1 from public.user_education where user_id=current_setting('test.education_a')::uuid) or exists(select 1 from public.user_exploration_activities where user_id=current_setting('test.education_a')::uuid) then raise exception 'Cross-account RLS leak'; end if;
  begin perform public.import_education_intake(current_setting('test.education_b')::uuid,current_setting('test.education_intake')::uuid,'{}'); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Unbound signup imported a guest'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.education_t'),true);
do $$ declare failed boolean:=false; begin
  begin perform public.get_education(current_setting('test.education_t')::uuid); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Teacher entered student questionnaire storage'; end if;
end $$;
reset role;
do $$ begin
  delete from auth.users where id=current_setting('test.education_a')::uuid;
  if exists(select 1 from public.user_education where user_id=current_setting('test.education_a')::uuid) or exists(select 1 from public.user_exploration_activities where user_id=current_setting('test.education_a')::uuid) then raise exception 'Deletion did not cascade'; end if;
end $$;
rollback;
select 'PASS: migration, bound/idempotent import, stale conflicts, validation, completion, immutable proposals, isolation, teacher boundary, Bihor bounds, deletion cascade; fixtures rolled back' as result;

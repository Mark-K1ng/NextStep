-- Synthetic accounts only. All writes are rolled back, including auth users.
begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
begin
  perform set_config('test.owner',a::text,true);
  perform set_config('test.other',b::text,true);
  insert into auth.users(id,email) values(a,a||'@example.invalid'),(b,b||'@example.invalid');
  insert into public.profiles(id,display_name,grade_level,county,interests,favorite_subjects)
    values(a,'Synthetic A','XI','Bihor','{}','{}'),(b,'Synthetic B','VIII','Cluj','{}','{}');
  if not exists(select 1 from public.user_personalization where user_id=a and onboarding_required and status='draft') then raise exception 'New signup not initialized'; end if;
  if has_table_privilege('anon','public.user_personalization','select') then raise exception 'Anonymous read granted'; end if;
  if has_table_privilege('authenticated','public.user_personalization','update') then raise exception 'Direct response write granted'; end if;
  perform set_config('test.course',(select id::text from public.courses order by id limit 1),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$
declare a uuid:=current_setting('test.owner')::uuid; b uuid:=current_setting('test.other')::uuid;
  ref uuid:=current_setting('test.course')::uuid; failed boolean; progress_id uuid; result public.user_personalization;
begin
  if exists(select 1 from public.user_personalization where user_id=b) then raise exception 'Cross-account response leak'; end if;
  result:=public.save_personalization(0,'{"domains":["technology"],"budget":["free"]}','draft',2,a);
  if result.revision<>1 or result.cursor<>2 or not result.onboarding_required then raise exception 'Autosave/resume failed'; end if;
  failed:=false;
  begin perform public.save_personalization(0,'{}','draft',0,a); exception when serialization_failure then failed:=true; end;
  if not failed then raise exception 'Stale device overwrote answers'; end if;
  failed:=false;
  begin perform public.save_personalization(1,'{"domains":["technology","science","business","arts"]}','completed',0,a); exception when others then failed:=true; end;
  if not failed then raise exception 'Selection limit bypassed'; end if;
  failed:=false;
  begin perform public.save_personalization(1,'{"domains":["unknown","science"]}','completed',0,a); exception when others then failed:=true; end;
  if not failed then raise exception 'Unknown accepted with another answer'; end if;
  result:=public.save_personalization(1,'{"domains":["technology"]}','skipped',2,a);
  if result.onboarding_required or result.answers->'domains' <> '["technology"]'::jsonb then raise exception 'Skip lost answers'; end if;
  failed:=false;
  begin perform public.set_bookmark('course',ref,true,b); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Session mismatch was accepted'; end if;
  perform public.set_bookmark('course',ref,true,a);
  if exists(select 1 from public.user_progress where user_id=a) or exists(select 1 from public.user_goals where user_id=a) then raise exception 'Bookmark changed path/goal'; end if;
  perform public.decide_recommendation('course',ref,'accepted','interests-v1',a);
  select id into progress_id from public.user_progress where user_id=a and ref_id=ref;
  if progress_id is null then raise exception 'Acceptance did not add step'; end if;
  update public.user_progress set status='completed' where id=progress_id;
  perform public.decide_recommendation('course',ref,'accepted','interests-v1',a);
  if not exists(select 1 from public.user_progress where id=progress_id and status='completed') then raise exception 'Acceptance reset completed step'; end if;
  perform public.set_bookmark('course',ref,false,a);
  if not exists(select 1 from public.user_progress where id=progress_id) then raise exception 'Unsaving deleted step'; end if;
  perform public.import_local_bookmarks(jsonb_build_array(jsonb_build_object('item_type','course','item_id',ref)),a);
  if exists(select 1 from public.user_favorites where user_id=a and item_id=ref) then raise exception 'Old device resurrected removed bookmark'; end if;
  result:=public.save_personalization(2,'{}','skipped',0,a);
  if result.answers<>'{}'::jsonb or not exists(select 1 from public.user_progress where id=progress_id and status='completed') then raise exception 'Clearing answers lost progress'; end if;
  failed:=false;
  begin perform public.remove_path_step(progress_id,b); exception when insufficient_privilege then failed:=true; end;
  if not failed or not exists(select 1 from public.user_progress where id=progress_id) then raise exception 'Session mismatch removed completed progress'; end if;
  perform public.set_bookmark('course',ref,true,a);
  perform public.remove_path_step(progress_id,a);
  if exists(select 1 from public.user_progress where id=progress_id) then raise exception 'Explicit removal kept completed progress'; end if;
  if not exists(select 1 from public.user_favorites where user_id=a and item_id=ref) then raise exception 'Removing a completed step removed its bookmark'; end if;
  if not exists(select 1 from public.user_recommendation_decisions where user_id=a and item_id=ref and decision='dismissed') then raise exception 'Removed step can be immediately suggested again'; end if;
  failed:=false;
  begin insert into public.user_favorites(user_id,item_type,item_id) values(b,'course',ref); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Cross-account bookmark write succeeded'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.other'),true);
do $$
begin
  if exists(select 1 from public.user_recommendation_decisions where user_id=current_setting('test.owner')::uuid)
    or exists(select 1 from public.user_bookmark_removals where user_id=current_setting('test.owner')::uuid) then raise exception 'Cross-account state leak'; end if;
end $$;
reset role;
do $$
begin
  delete from auth.users where id=current_setting('test.owner')::uuid;
  if exists(select 1 from public.user_personalization where user_id=current_setting('test.owner')::uuid)
    or exists(select 1 from public.user_recommendation_decisions where user_id=current_setting('test.owner')::uuid)
    or exists(select 1 from public.user_bookmark_removals where user_id=current_setting('test.owner')::uuid) then raise exception 'Account deletion did not cascade'; end if;
end $$;
rollback;
select 'Passed: signup, resume, conflicts, limits, skip, separation, tombstones, completed progress, isolation, deletion; fixtures rolled back' as result;

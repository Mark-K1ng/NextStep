-- Stale revisions are HTTP 409 conflicts, not retryable transaction failures.
create or replace function public.save_education_questionnaire(expected_user uuid, expected_revision int, questionnaire text,
  answers jsonb, skipped jsonb, next_cursor int, completed boolean, clear_answers boolean default false)
returns public.user_education language plpgsql security definer set search_path='' as $$
declare result public.user_education; definition jsonb; question_def jsonb; entry record; applicable jsonb; grade text; old jsonb; attempt int;
begin
  perform account_private.education_owner(expected_user);
  result := public.get_education(expected_user);
  if result.revision is distinct from expected_revision then raise exception 'Reload responses' using errcode='PT409'; end if;
  select d.definition into definition from public.education_definitions d where d.id=questionnaire;
  if definition is null or answers is null or skipped is null or completed is null or clear_answers is null
    or jsonb_typeof(answers)<>'object' or jsonb_typeof(skipped)<>'array' or octet_length(answers::text)>8192 or jsonb_array_length(skipped)>8 then raise exception 'Invalid questionnaire'; end if;
  select grade_level into grade from public.profiles where id=auth.uid();
  select jsonb_agg(value) into applicable from jsonb_array_elements(definition->'questions') where not coalesce((value->>'universityOnly')::boolean,false) or grade='student';
  if next_cursor is null or next_cursor<0 or next_cursor>=jsonb_array_length(applicable) then raise exception 'Invalid cursor'; end if;
  for entry in select * from jsonb_each(answers) loop
    select value into question_def from jsonb_array_elements(definition->'questions') where value->>'id'=entry.key;
    if question_def is null or jsonb_typeof(entry.value)<>'array' then raise exception 'Invalid question'; end if;
    if jsonb_array_length(entry.value)>(question_def->>'limit')::int or
      exists(select 1 from jsonb_array_elements(entry.value) v where jsonb_typeof(v)<>'string' or
        (v<>'"unknown"'::jsonb and not exists(select 1 from jsonb_array_elements(question_def->'options') o where o->0=v))) or
      (entry.value ? 'unknown' and jsonb_array_length(entry.value)<>1) or
      (select count(*)<>count(distinct value) from jsonb_array_elements(entry.value)) then raise exception 'Invalid choices'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(skipped) v where jsonb_typeof(v)<>'string' or not exists(
    select 1 from jsonb_array_elements(definition->'questions') q where q->'id'=v)) or
    (select count(*)<>count(distinct value) from jsonb_array_elements(skipped)) or
    exists(select 1 from jsonb_array_elements_text(skipped) s where jsonb_array_length(coalesce(answers->s,'[]'))>0)
    then raise exception 'Invalid skipped answers'; end if;
  if completed and exists(select 1 from jsonb_array_elements(applicable) q where
    jsonb_array_length(coalesce(answers->(q->>'id'),'[]'))=0 and not skipped ? (q->>'id')) then raise exception 'Unvisited questions'; end if;
  old := result.responses->questionnaire;
  attempt := coalesce((old->>'attempt')::int,1) + case when clear_answers or old->>'status'='completed' then 1 else 0 end;
  update public.user_education set responses=case when clear_answers then jsonb_set(responses,array[questionnaire],
    jsonb_build_object('answers','{}'::jsonb,'skipped','[]'::jsonb,'cursor',0,'status','draft','attempt',attempt)) else
    jsonb_set(responses,array[questionnaire],jsonb_build_object('answers',answers,'skipped',skipped,'cursor',next_cursor,'status',case when completed then 'completed' else 'draft' end,'attempt',attempt)) end,
    revision=revision+1, updated_at=now() where user_id=auth.uid() returning * into result;
  return result;
end $$;

create or replace function public.save_exploration_activity(expected_user uuid, activity text, direction text,
  next_status text, feedback text, snapshot jsonb, expected_revision int default -1)
returns public.user_exploration_activities language plpgsql security definer set search_path='' as $$
declare result public.user_exploration_activities; current_revision int;
begin
  perform account_private.education_owner(expected_user);
  perform 1 from public.profiles where id=auth.uid() for update;
  select revision into current_revision from public.user_exploration_activities where user_id=auth.uid() and activity_id=activity;
  if coalesce(current_revision,-1) is distinct from expected_revision then raise exception 'Reload activity' using errcode='PT409'; end if;
  if next_status not in ('accepted','completed','dismissed') or next_status is null or
    (feedback is not null and (next_status<>'completed' or feedback not in ('enjoyed','more','unsure','not_for_me'))) or
    (next_status='completed' and current_revision is null) or
    snapshot is null or jsonb_typeof(snapshot)<>'object' or octet_length(snapshot::text)>4096 or
    snapshot->>'id' is distinct from activity or snapshot->>'directionId' is distinct from direction then raise exception 'Invalid activity'; end if;
  insert into public.user_exploration_activities(user_id,activity_id,direction_id,status,reflection,proposal)
    values(auth.uid(),activity,direction,next_status,feedback,snapshot)
  on conflict(user_id,activity_id) do update set status=excluded.status,reflection=excluded.reflection,
    revision=user_exploration_activities.revision+1,updated_at=now()
  returning * into result;
  -- Existing proposal text is immutable: refreshed suggestions require a new explicit choice.
  return result;
end $$;

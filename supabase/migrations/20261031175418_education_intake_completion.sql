-- A fully answered short intake completes the matching interests questionnaire.
-- Signup-bound drafts remain retryable without an arbitrary expiry. Existing answers always win.
create or replace function public.import_education_intake(expected_user uuid, import_id uuid, responses jsonb)
returns public.user_education language plpgsql security definer set search_path='' as $$
declare result public.user_education; entry record; merged jsonb; existing jsonb;
begin
  perform account_private.education_owner(expected_user);
  result := public.get_education(expected_user);
  if result.guest_import_id=import_id then return result; end if;
  if result.guest_import_id is not null or import_id is null or not exists(
    select 1 from auth.users where id=auth.uid() and raw_user_meta_data->>'nextstep_guest_intake'=import_id::text
  ) then raise exception 'Intake not bound to this signup' using errcode='42501'; end if;
  if responses is null or jsonb_typeof(responses)<>'object' or octet_length(responses::text)>8192 then raise exception 'Invalid intake'; end if;
  for entry in select * from jsonb_each(responses) loop
    if entry.key not in ('interests','practical') then raise exception 'Invalid intake questionnaire'; end if;
    existing := result.responses->entry.key;
    -- Existing values, explicit skips and completion always win over a guest draft.
    merged := entry.value - array(select jsonb_array_elements_text(coalesce(existing->'skipped','[]'))) || coalesce(existing->'answers','{}');
    if coalesce(existing->>'status','')<>'completed' then
      result := public.save_education_questionnaire(expected_user,result.revision,entry.key,merged,coalesce(existing->'skipped','[]'),coalesce((existing->>'cursor')::int,0),entry.key='interests' and not exists(select 1 from jsonb_array_elements((select definition from public.education_definitions where id='interests')->'questions') q where jsonb_array_length(coalesce(merged->(q->>'id'),'[]'))=0));
    end if;
  end loop;
  update public.user_education set guest_import_id=import_id,revision=revision+1,updated_at=now() where user_id=auth.uid() returning * into result;
  return result;
end $$;

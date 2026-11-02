-- Bind interactive requests to the account that started them. A session change
-- between reading a cache and issuing an RPC must never write into another user.
create function public.import_local_bookmarks(items jsonb, expected_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Session changed' using errcode='42501'; end if;
  perform public.import_local_bookmarks(items);
end $$;
create function public.set_bookmark(kind text,ref uuid,selected boolean,expected_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Session changed' using errcode='42501'; end if;
  perform public.set_bookmark(kind,ref,selected);
end $$;
create function public.save_personalization(expected_revision integer,responses jsonb,new_status text,next_cursor integer,expected_user uuid)
returns public.user_personalization language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Session changed' using errcode='42501'; end if;
  return public.save_personalization(expected_revision,responses,new_status,next_cursor);
end $$;
create function public.decide_recommendation(kind text,ref uuid,choice text,algorithm text,expected_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Session changed' using errcode='42501'; end if;
  perform 1 from public.profiles where id=auth.uid() for update;
  perform public.decide_recommendation(kind,ref,choice,algorithm);
end $$;
create function public.remove_path_step(step_id uuid,expected_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Session changed' using errcode='42501'; end if;
  perform public.remove_path_step(step_id);
end $$;
create function public.reset_dismissed_recommendations(expected_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Session changed' using errcode='42501'; end if;
  perform public.reset_dismissed_recommendations();
end $$;
revoke all on function public.import_local_bookmarks(jsonb),public.set_bookmark(text,uuid,boolean),public.save_personalization(integer,jsonb,text,integer),public.decide_recommendation(text,uuid,text,text),public.remove_path_step(uuid),public.reset_dismissed_recommendations() from authenticated;
revoke all on function public.import_local_bookmarks(jsonb,uuid),public.set_bookmark(text,uuid,boolean,uuid),public.save_personalization(integer,jsonb,text,integer,uuid),public.decide_recommendation(text,uuid,text,text,uuid),public.remove_path_step(uuid,uuid),public.reset_dismissed_recommendations(uuid) from public,anon;
grant execute on function public.import_local_bookmarks(jsonb,uuid),public.set_bookmark(text,uuid,boolean,uuid),public.save_personalization(integer,jsonb,text,integer,uuid),public.decide_recommendation(text,uuid,text,text,uuid),public.remove_path_step(uuid,uuid),public.reset_dismissed_recommendations(uuid) to authenticated;

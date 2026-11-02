create function public.remove_path_step(step_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare removed public.user_progress;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.user_progress where id=step_id and user_id=auth.uid() and status<>'completed' returning * into removed;
  if not found then raise exception 'Step unavailable or completed'; end if;
  insert into public.user_recommendation_decisions(user_id,item_type,item_id,decision,algorithm_version)
    values(auth.uid(),removed.step_type,removed.ref_id,'dismissed','interests-v1')
    on conflict(user_id,item_type,item_id) do update set decision='dismissed',updated_at=now();
end $$;
revoke all on function public.remove_path_step(uuid) from public,anon;
grant execute on function public.remove_path_step(uuid) to authenticated;

-- Each legacy device may import once. Tombstones prevent an older phone's
-- cache from resurrecting an option removed on another phone.
create table public.user_bookmark_removals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  removed_at timestamptz not null default now(),
  primary key(user_id,item_type,item_id)
);
alter table public.user_bookmark_removals enable row level security;
revoke all on public.user_bookmark_removals from anon,authenticated;
grant select on public.user_bookmark_removals to authenticated;
create policy own_bookmark_removals on public.user_bookmark_removals for select to authenticated using ((select auth.uid())=user_id);
create or replace function public.import_local_bookmarks(items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare entry jsonb; principal uuid:=auth.uid();
begin
  if principal is null then raise exception 'Authentication required'; end if;
  perform 1 from public.profiles where id=principal for update;
  if jsonb_typeof(items)<>'array' or jsonb_array_length(items)>2000 then raise exception 'Invalid import'; end if;
  insert into public.user_bookmark_imports(user_id) values(principal) on conflict do nothing;
  for entry in select value from jsonb_array_elements(items) loop
    if public.catalogue_reference_exists(entry->>'item_type',(entry->>'item_id')::uuid)
      and not exists(select 1 from public.user_bookmark_removals where user_id=principal and item_type=entry->>'item_type' and item_id=(entry->>'item_id')::uuid) then
      insert into public.user_favorites(user_id,item_id,item_type) values(principal,(entry->>'item_id')::uuid,entry->>'item_type') on conflict do nothing;
    end if;
  end loop;
end $$;
create or replace function public.set_bookmark(kind text, ref uuid, selected boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  -- Serialize import/save/remove for a principal so a concurrent legacy import
  -- cannot race a removal and recreate its bookmark.
  perform 1 from public.profiles where id=auth.uid() for update;
  if selected then
    if not public.catalogue_reference_exists(kind,ref) then raise exception 'Unavailable option'; end if;
    delete from public.user_bookmark_removals where user_id=auth.uid() and item_type=kind and item_id=ref;
    insert into public.user_favorites(user_id,item_type,item_id) values(auth.uid(),kind,ref) on conflict do nothing;
  else
    delete from public.user_favorites where user_id=auth.uid() and item_type=kind and item_id=ref;
    insert into public.user_bookmark_removals(user_id,item_type,item_id) values(auth.uid(),kind,ref) on conflict do nothing;
  end if;
end $$;

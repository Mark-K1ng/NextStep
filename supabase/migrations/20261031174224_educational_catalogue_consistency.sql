-- Keep school-profile bookmarks linked to their parent and avoid a global lock on clean catalogue reads.
create or replace function account_private.refresh_education_catalogue() returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.education_catalogue;
  insert into public.education_catalogue(kind,id,payload,tags)
  select 'skill',s.id,jsonb_build_object('id',s.id,'type','skill','name',s.name,'domains',array[s.category],'skills',jsonb_build_array(jsonb_build_object('id',s.id,'level',1))),array[s.category] from public.skills s;
  insert into public.education_catalogue(kind,id,payload,tags)
  select 'career',c.id,jsonb_build_object('id',c.id,'type','career','name',c.name,'domains',array[c.domain],'skills',coalesce((select jsonb_agg(jsonb_build_object('id',skill_id,'level',importance)) from public.career_skills where career_id=c.id),'[]')),array[c.domain] from public.careers c;
  insert into public.education_catalogue(kind,id,payload,tags)
  select 'course',c.id,jsonb_build_object('id',c.id,'type','course','name',c.title,'domains',d.tags,'skills',d.skills,'free',c.is_free,'language',c.language,'level',c.level),d.tags
  from public.courses c cross join lateral(select coalesce(array_agg(distinct s.category),'{}') tags,coalesce(jsonb_agg(jsonb_build_object('id',s.id,'level',cs.depth)),'[]') skills from public.course_skills cs join public.skills s on s.id=cs.skill_id where cs.course_id=c.id) d;
  insert into public.education_catalogue(kind,id,payload,tags)
  select 'school',s.id,jsonb_build_object('id',s.id,'type','school','name',s.name,'county',s.county,'domains','[]'::jsonb,'subjects',d.subjects,'schoolProfileIds',(select coalesce(jsonb_agg(id),'[]') from public.school_profiles where school_id=s.id)),d.subjects
  from public.schools s cross join lateral(select coalesce(array_agg(distinct subject),'{}') subjects from public.school_profiles sp cross join lateral unnest(sp.key_subjects) subject where sp.school_id=s.id and sp.is_current is distinct from false) d where s.county='Bihor';
  insert into public.education_catalogue(kind,id,payload,tags)
  select 'program',p.id,jsonb_build_object('id',p.id,'type','program','name',p.name,'county',u.county,'degree',p.degree_level,'domains',d.tags,'careerIds',d.careers,'skills',coalesce((select jsonb_agg(jsonb_build_object('id',skill_id,'level',depth)) from public.program_skills where program_id=p.id),'[]')),d.tags
  from public.programs p join public.universities u on u.id=p.university_id cross join lateral(select coalesce(array_agg(distinct c.domain),'{}') tags,coalesce(array_agg(c.id),'{}') careers from public.program_careers pc join public.careers c on c.id=pc.career_id where pc.program_id=p.id) d where u.county='Bihor';
  insert into public.education_catalogue(kind,id,payload,tags)
  select 'university',u.id,jsonb_build_object('id',u.id,'type','university','name',u.name,'county',u.county,'domains',d.tags),d.tags
  from public.universities u cross join lateral(select coalesce(array_agg(distinct c.domain),'{}') tags from public.programs p join public.program_careers pc on pc.program_id=p.id join public.careers c on c.id=pc.career_id where p.university_id=u.id) d where u.county='Bihor';
  update public.education_catalogue_version set revision=revision+1,dirty=false;
end $$;

create or replace function public.education_candidates(expected_user uuid, preferred_tags text[] default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; total int;
begin
  perform account_private.education_owner(expected_user);
  if preferred_tags is null or cardinality(preferred_tags)>32 or octet_length(array_to_string(preferred_tags,''))>2048 then raise exception 'Invalid tags'; end if;
  if (select dirty from public.education_catalogue_version where singleton) then
    perform 1 from public.education_catalogue_version where singleton for update;
    if (select dirty from public.education_catalogue_version where singleton) then perform account_private.refresh_education_catalogue(); end if;
  end if;
  select count(*) into total from public.education_catalogue;
  select coalesce(jsonb_agg(payload),'[]') into result from (
    select payload,row_number() over(partition by kind order by
      case when exists(select 1 from public.user_goals g where g.user_id=auth.uid() and (g.career_id=ec.id or payload->'careerIds' ? g.career_id::text)) then 1 else 0 end desc,
      case when exists(select 1 from public.user_favorites f where f.user_id=auth.uid() and (f.item_id=ec.id or payload->'schoolProfileIds' ? f.item_id::text)) then 1 else 0 end desc,
      case when tags && preferred_tags then 1 else 0 end desc,id) rank
    from public.education_catalogue ec
  ) ranked where rank<=120;
  return jsonb_build_object('candidates',result,'truncated',total>jsonb_array_length(result),
    'version',(select revision from public.education_catalogue_version where singleton));
end $$;
select account_private.refresh_education_catalogue();

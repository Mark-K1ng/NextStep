-- Keep withdrawn catalogue resources for existing account references, while excluding them from all client reads.
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "Only current courses are published" ON public.courses;
CREATE POLICY "Only current courses are published" ON public.courses AS RESTRICTIVE FOR SELECT TO public USING (is_current);
COMMENT ON COLUMN public.courses.is_current IS 'False withdraws an unverified or retired resource without deleting existing account references.';

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
  from public.courses c cross join lateral(select coalesce(array_agg(distinct s.category),'{}') tags,coalesce(jsonb_agg(jsonb_build_object('id',s.id,'level',cs.depth)),'[]') skills from public.course_skills cs join public.skills s on s.id=cs.skill_id where cs.course_id=c.id) d where c.is_current;
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

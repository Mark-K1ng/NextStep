-- Versioned, owner-bound exploration data. Earlier preferences/progress stay intact.
create table public.education_definitions (
  id text primary key, version int not null check(version=1), definition jsonb not null
);
alter table public.education_definitions enable row level security;
revoke all on public.education_definitions from public,anon,authenticated;
grant select on public.education_definitions to authenticated;
create policy read_education_definitions on public.education_definitions for select to authenticated using(true);

create table public.user_education (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  version int not null default 1 check(version=1),
  responses jsonb not null default '{}' check(jsonb_typeof(responses)='object' and octet_length(responses::text)<=16384),
  revision int not null default 0,
  guest_import_id uuid unique,
  updated_at timestamptz not null default now()
);
create table public.user_exploration_activities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id text not null check(activity_id ~ '^(technology|science|business|arts|people|engineering):(read|try|talk)$'),
  direction_id text not null check(direction_id in ('technology','science','business','arts','people','engineering')),
  status text not null check(status in ('accepted','completed','dismissed')),
  reflection text check(reflection in ('enjoyed','more','unsure','not_for_me')),
  proposal jsonb not null check(jsonb_typeof(proposal)='object' and octet_length(proposal::text)<=4096),
  algorithm_version text not null default 'bihor-exploration-v1',
  revision int not null default 0,
  updated_at timestamptz not null default now(),
  primary key(user_id,activity_id),
  check(split_part(activity_id,':',1)=direction_id),
  check(reflection is null or status='completed')
);
alter table public.user_education enable row level security;
alter table public.user_exploration_activities enable row level security;
revoke all on public.user_education,public.user_exploration_activities from public,anon,authenticated;
grant select on public.user_education,public.user_exploration_activities to authenticated;
create policy own_education on public.user_education for select to authenticated using((select auth.uid())=user_id);
create policy own_activities on public.user_exploration_activities for select to authenticated using((select auth.uid())=user_id);

create function account_private.education_owner(expected_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or expected_user is distinct from auth.uid() or not exists(
    select 1 from account_private.identities where user_id=auth.uid() and account_kind='student'
  ) then raise exception 'Student owner required' using errcode='42501'; end if;
end $$;
revoke all on function account_private.education_owner(uuid) from public,anon,authenticated;

create function public.get_education(expected_user uuid) returns public.user_education
language plpgsql security definer set search_path='' as $$
declare result public.user_education; legacy jsonb; interests jsonb; practical jsonb; migrated jsonb := '{}';
begin
  perform account_private.education_owner(expected_user);
  -- Serializes initial migration with every education write, including guest import.
  perform 1 from public.profiles where id=auth.uid() for update;
  select * into result from public.user_education where user_id=auth.uid();
  if found then return result; end if;
  select answers into legacy from public.user_personalization where user_id=auth.uid() and version=1;
  select coalesce(jsonb_object_agg(key,value),'{}') into interests from jsonb_each(coalesce(legacy,'{}')) where key in ('domains','subjects','activities') and jsonb_array_length(value)>0;
  select coalesce(jsonb_object_agg(key,value),'{}') into practical from jsonb_each(coalesce(legacy,'{}')) where key in ('language','budget','pace') and jsonb_array_length(value)>0;
  if interests<>'{}' then migrated := migrated || jsonb_build_object('interests',jsonb_build_object('answers',interests,'skipped','[]'::jsonb,'cursor',0,'status','draft','attempt',1)); end if;
  if practical<>'{}' then migrated := migrated || jsonb_build_object('practical',jsonb_build_object('answers',practical,'skipped','[]'::jsonb,'cursor',0,'status','draft','attempt',1)); end if;
  insert into public.user_education(user_id,responses) values(auth.uid(),migrated) returning * into result;
  return result;
end $$;

create function public.save_education_questionnaire(expected_user uuid, expected_revision int, questionnaire text,
  answers jsonb, skipped jsonb, next_cursor int, completed boolean, clear_answers boolean default false)
returns public.user_education language plpgsql security definer set search_path='' as $$
declare result public.user_education; definition jsonb; question_def jsonb; entry record; applicable jsonb; grade text; old jsonb; attempt int;
begin
  perform account_private.education_owner(expected_user);
  result := public.get_education(expected_user);
  if result.revision is distinct from expected_revision then raise exception 'Reload responses' using errcode='40001'; end if;
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

create function public.import_education_intake(expected_user uuid, import_id uuid, responses jsonb)
returns public.user_education language plpgsql security definer set search_path='' as $$
declare result public.user_education; entry record; merged jsonb; existing jsonb;
begin
  perform account_private.education_owner(expected_user);
  result := public.get_education(expected_user);
  if result.guest_import_id=import_id then return result; end if;
  if result.guest_import_id is not null or import_id is null or not exists(
    select 1 from auth.users where id=auth.uid() and raw_user_meta_data->>'nextstep_guest_intake'=import_id::text
      and created_at>now()-interval '7 days'
  ) then raise exception 'Intake not bound to this signup' using errcode='42501'; end if;
  if responses is null or jsonb_typeof(responses)<>'object' or octet_length(responses::text)>8192 then raise exception 'Invalid intake'; end if;
  for entry in select * from jsonb_each(responses) loop
    if entry.key not in ('interests','practical') then raise exception 'Invalid intake questionnaire'; end if;
    existing := result.responses->entry.key;
    -- Existing values, explicit skips and completion always win over a guest draft.
    merged := entry.value - array(select jsonb_array_elements_text(coalesce(existing->'skipped','[]'))) || coalesce(existing->'answers','{}');
    if coalesce(existing->>'status','')<>'completed' then
      result := public.save_education_questionnaire(expected_user,result.revision,entry.key,merged,coalesce(existing->'skipped','[]'),coalesce((existing->>'cursor')::int,0),false);
    end if;
  end loop;
  update public.user_education set guest_import_id=import_id,revision=revision+1,updated_at=now() where user_id=auth.uid() returning * into result;
  return result;
end $$;

create function public.save_exploration_activity(expected_user uuid, activity text, direction text,
  next_status text, feedback text, snapshot jsonb, expected_revision int default -1)
returns public.user_exploration_activities language plpgsql security definer set search_path='' as $$
declare result public.user_exploration_activities; current_revision int;
begin
  perform account_private.education_owner(expected_user);
  perform 1 from public.profiles where id=auth.uid() for update;
  select revision into current_revision from public.user_exploration_activities where user_id=auth.uid() and activity_id=activity;
  if coalesce(current_revision,-1) is distinct from expected_revision then raise exception 'Reload activity' using errcode='40001'; end if;
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

-- Shared, versioned catalogue projection; no student responses are stored here.
create table public.education_catalogue (
  kind text not null, id uuid not null, payload jsonb not null, tags text[] not null default '{}',
  primary key(kind,id)
);
create table public.education_catalogue_version (singleton boolean primary key default true check(singleton), revision bigint not null default 1, dirty boolean not null default false);
insert into public.education_catalogue_version(singleton,revision) values(true,1);
alter table public.education_catalogue enable row level security;
alter table public.education_catalogue_version enable row level security;
revoke all on public.education_catalogue,public.education_catalogue_version from public,anon,authenticated;
create index education_catalogue_tags on public.education_catalogue using gin(tags);
create function account_private.refresh_education_catalogue() returns void language plpgsql security definer set search_path='' as $$
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
revoke all on function account_private.refresh_education_catalogue() from public,anon,authenticated;
select account_private.refresh_education_catalogue();

create function account_private.invalidate_education_catalogue() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.education_catalogue_version set dirty=true where singleton; return null; end $$;
revoke all on function account_private.invalidate_education_catalogue() from public,anon,authenticated;
do $$ declare name text; begin
  foreach name in array array['skills','careers','courses','course_skills','career_skills','schools','school_profiles','universities','programs','program_skills','program_careers'] loop
    execute format('create trigger invalidate_education_catalogue after insert or update or delete or truncate on public.%I for each statement execute function account_private.invalidate_education_catalogue()',name);
  end loop;
end $$;

create function public.education_candidates(expected_user uuid, preferred_tags text[] default '{}') returns jsonb
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

revoke all on function public.get_education(uuid),public.save_education_questionnaire(uuid,int,text,jsonb,jsonb,int,boolean,boolean),
  public.import_education_intake(uuid,uuid,jsonb),public.save_exploration_activity(uuid,text,text,text,text,jsonb,int),public.education_candidates(uuid,text[]) from public,anon;
grant execute on function public.get_education(uuid),public.save_education_questionnaire(uuid,int,text,jsonb,jsonb,int,boolean,boolean),
  public.import_education_intake(uuid,uuid,jsonb),public.save_exploration_activity(uuid,text,text,text,text,jsonb,int),public.education_candidates(uuid,text[]) to authenticated;

-- Fixed definitions shared with the client; no externally editable scoring rules.
insert into public.education_definitions values ('interests',1,$definition${"id":"interests","title":"Interese și curiozități","minutes":"2–3 min","purpose":"Descoperă domenii și activități pe care ai vrea să le explorezi.","questions":[{"id":"domains","title":"Ce domenii îți stârnesc curiozitatea?","limit":3,"options":[["technology","Tehnologie"],["science","Științe"],["business","Economie și afaceri"],["arts","Arte și media"],["people","Lucrul cu oamenii"],["engineering","Inginerie"]]},{"id":"subjects","title":"Ce materii îți plac?","limit":3,"options":[["math","Matematică"],["informatics","Informatică"],["science","Științe ale naturii"],["languages","Limbi și literatură"],["social","Științe sociale"],["arts","Arte"]]},{"id":"activities","title":"Ce ți-ar plăcea să faci mai des?","limit":2,"options":[["solve","Să rezolv probleme"],["create","Să creez ceva"],["help","Să ajut oameni"],["organize","Să organizez proiecte"],["build","Să construiesc lucruri"]]}]}$definition$::jsonb);
insert into public.education_definitions values ('work',1,$definition${"id":"work","title":"Cum îmi place să lucrez","minutes":"2 min","purpose":"Alege experiențe potrivite felului în care preferi să lucrezi.","questions":[{"id":"environment","title":"În ce fel de activitate ai vrea să te implici?","limit":2,"options":[["solve","Să rezolv probleme"],["create","Să creez ceva"],["help","Să ajut oameni"],["organize","Să organizez proiecte"],["build","Să construiesc lucruri"]]},{"id":"collaboration","title":"Cum ai prefera să încerci o activitate nouă?","limit":1,"options":[["alone","În ritmul meu"],["together","Împreună cu cineva"],["either","Oricare variantă"]]},{"id":"format","title":"Cum ai vrea să începi explorarea?","limit":1,"options":[["read","Citesc și compar"],["try","Încerc ceva practic"],["talk","Discut cu cineva despre experiența sa"]]}]}$definition$::jsonb);
insert into public.education_definitions values ('confidence',1,$definition${"id":"confidence","title":"Abilități și încredere","minutes":"2 min","purpose":"Separă ce ai încercat deja de ce ai vrea să exersezi. Nu măsoară aptitudini.","questions":[{"id":"tried","title":"Ce ai avut ocazia să încerci?","limit":3,"options":[["solve","Să rezolv probleme"],["create","Să creez ceva"],["help","Să ajut oameni"],["organize","Să organizez proiecte"],["build","Să construiesc lucruri"]]},{"id":"confidence","title":"Câtă încredere ai când începi o activitate nouă?","limit":1,"options":[["supported","Prefer îndrumare la început"],["independent","Încerc singur și cer ajutor când am nevoie"],["varies","Depinde de activitate"]]},{"id":"practice","title":"Ce ai vrea să exersezi?","limit":2,"options":[["solve","Să rezolv probleme"],["create","Să creez ceva"],["help","Să ajut oameni"],["organize","Să organizez proiecte"],["build","Să construiesc lucruri"]]}]}$definition$::jsonb);
insert into public.education_definitions values ('practical',1,$definition${"id":"practical","title":"Obiective și condiții practice","minutes":"2–3 min","purpose":"Alege următorul pas în funcție de etapa, timpul și resursele tale.","questions":[{"id":"pace","title":"Cu ce ai vrea să începi?","limit":1,"options":[["explore","Să explorez opțiuni"],["practice","Să exersez abilități"],["study","Să aleg ce voi studia"]]},{"id":"language","title":"În ce limbă preferi cursurile?","limit":1,"options":[["ro","Română"],["en","Engleză"],["either","Oricare"]]},{"id":"budget","title":"Ce cursuri vrei să vezi?","limit":1,"options":[["free","Doar cursuri gratuite"],["any","Gratuite și cu plată"]]},{"id":"time","title":"Cât timp ai pentru următoarea activitate?","limit":1,"options":[["short","Aproximativ 10 minute"],["medium","Aproximativ 30 de minute"],["long","O oră sau mai mult"]]},{"id":"field","title":"Care este domeniul studiilor tale actuale?","limit":1,"universityOnly":true,"options":[["technology","Tehnologie"],["science","Științe / sănătate"],["business","Economie"],["arts","Arte / umanități"],["people","Educație / social"],["engineering","Inginerie"],["other","Alt domeniu"]]},{"id":"degree","title":"La ce nivel studiezi?","limit":1,"universityOnly":true,"options":[["bachelor","Licență"],["master","Master"],["doctorate","Doctorat"],["other","Altă formă de studiu"]]},{"id":"year","title":"În ce an ești?","limit":1,"universityOnly":true,"options":[["1","Anul I"],["2","Anul II"],["3","Anul III"],["4+","Anul IV sau mai mare"]]},{"id":"goal","title":"Ce ai vrea să clarifici în această etapă?","limit":1,"universityOnly":true,"options":[["deepen","Aprofundez domeniul actual"],["alternatives","Explorez alte direcții"],["work","Mă pregătesc pentru muncă"]]}]}$definition$::jsonb);

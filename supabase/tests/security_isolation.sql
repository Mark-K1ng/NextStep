-- Synthetic identities only. All writes, including auth fixtures, roll back.
BEGIN;
SET LOCAL statement_timeout = '15s';
CREATE TEMP TABLE audit_ids AS SELECT gen_random_uuid() a, gen_random_uuid() b;
CREATE TEMP TABLE audit_cases(table_name text, owner_column text, insert_sql text);
INSERT INTO auth.users(id, aud, role, email_confirmed_at)
  SELECT a, 'authenticated', 'authenticated', now() FROM audit_ids
  UNION ALL SELECT b, 'authenticated', 'authenticated', now() FROM audit_ids;
INSERT INTO public.profiles(id,display_name,grade_level,county,interests,favorite_subjects)
  SELECT a,'Audit fixture','VIII','Bihor','{}'::text[],'{}'::text[] FROM audit_ids
  UNION ALL SELECT b,'Audit fixture','VIII','Bihor','{}'::text[],'{}'::text[] FROM audit_ids;
INSERT INTO public.user_skills(user_id,skill_id,level)
  SELECT id, (SELECT id FROM public.skills LIMIT 1), 1
  FROM (SELECT a id FROM audit_ids UNION ALL SELECT b FROM audit_ids) u;
INSERT INTO public.user_goals(user_id,career_id)
  SELECT id, (SELECT id FROM public.careers LIMIT 1)
  FROM (SELECT a id FROM audit_ids UNION ALL SELECT b FROM audit_ids) u;
INSERT INTO public.user_progress(user_id,step_type,ref_id,status)
  SELECT id,'school',(SELECT id FROM public.schools LIMIT 1),'in_progress'
  FROM (SELECT a id FROM audit_ids UNION ALL SELECT b FROM audit_ids) u;
INSERT INTO public.consents(user_id,kind,version,granted_at)
  SELECT id,'data_processing','audit-fixture',now()
  FROM (SELECT a id FROM audit_ids UNION ALL SELECT b FROM audit_ids) u;
INSERT INTO public.user_favorites(user_id,item_id,item_type)
  SELECT id,(SELECT id FROM public.schools LIMIT 1),'school'
  FROM (SELECT a id FROM audit_ids UNION ALL SELECT b FROM audit_ids) u;
INSERT INTO audit_cases VALUES
 ('profiles','id','INSERT INTO public.profiles(id,display_name,grade_level,county,interests,favorite_subjects) VALUES ($1,''attacker'',''VIII'',''Bihor'',''{}'',''{}'')'),
 ('user_skills','user_id','INSERT INTO public.user_skills(user_id,skill_id,level) VALUES ($1,(SELECT id FROM public.skills LIMIT 1),1)'),
 ('user_goals','user_id','INSERT INTO public.user_goals(user_id,career_id) VALUES ($1,(SELECT id FROM public.careers LIMIT 1))'),
 ('user_progress','user_id','INSERT INTO public.user_progress(user_id,step_type,ref_id,status) VALUES ($1,''school'',gen_random_uuid(),''in_progress'')'),
 ('consents','user_id','INSERT INTO public.consents(user_id,kind,version,granted_at) VALUES ($1,''data_processing'',''injected'',now())'),
 ('user_favorites','user_id','INSERT INTO public.user_favorites(user_id,item_id,item_type) VALUES ($1,gen_random_uuid(),''school'')');
DO $$
DECLARE a uuid; b uuid; c record; role_name text; n integer;
BEGIN
 SELECT i.a,i.b INTO a,b FROM audit_ids i;
 FOR c IN SELECT * FROM audit_cases LOOP
  -- Confirm the fixtures exist before trusting a zero-row attack result.
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I=$1',c.table_name,c.owner_column) INTO n USING b;
  IF n <> 1 THEN RAISE EXCEPTION 'Missing fixture: %',c.table_name; END IF;
  FOREACH role_name IN ARRAY ARRAY['authenticated','anon'] LOOP
   PERFORM set_config('request.jwt.claim.sub',CASE WHEN role_name='authenticated' THEN a::text ELSE '' END,true);
   PERFORM set_config('request.jwt.claims',CASE WHEN role_name='authenticated' THEN jsonb_build_object('sub',a,'role',role_name)::text ELSE '{}' END,true);
   EXECUTE format('SET LOCAL ROLE %I',role_name);
   BEGIN
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I=$1',c.table_name,c.owner_column) INTO n USING b;
    IF n <> 0 THEN RAISE EXCEPTION 'Cross-account SELECT allowed: % %',role_name,c.table_name; END IF;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   BEGIN
    EXECUTE format('UPDATE public.%I SET %I=%I WHERE %I=$1',c.table_name,c.owner_column,c.owner_column,c.owner_column) USING b;
    GET DIAGNOSTICS n=ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'Cross-account UPDATE allowed: % %',role_name,c.table_name; END IF;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   BEGIN
    EXECUTE format('DELETE FROM public.%I WHERE %I=$1',c.table_name,c.owner_column) USING b;
    GET DIAGNOSTICS n=ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'Cross-account DELETE allowed: % %',role_name,c.table_name; END IF;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   BEGIN
    EXECUTE c.insert_sql USING b;
    RAISE EXCEPTION 'Cross-account INSERT allowed: % %',role_name,c.table_name;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   IF role_name='authenticated' THEN
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I=$1',c.table_name,c.owner_column) INTO n USING a;
    IF n <> 1 THEN RAISE EXCEPTION 'Owner read failed: %',c.table_name; END IF;
    BEGIN
     EXECUTE format('UPDATE public.%I SET %I=$1 WHERE %I=$2',c.table_name,c.owner_column,c.owner_column) USING gen_random_uuid(),a;
     GET DIAGNOSTICS n=ROW_COUNT;
     IF n <> 0 THEN RAISE EXCEPTION 'Ownership transfer allowed: %',c.table_name; END IF;
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   END IF;
   RESET ROLE;
  END LOOP;
 END LOOP;
 -- Catalogue writes and maintenance privileges must be absent for both roles.
 FOR c IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_table_privilege(role_name,format('public.%I',c.tablename),'TRUNCATE')
      OR has_table_privilege(role_name,format('public.%I',c.tablename),'TRIGGER')
      OR has_table_privilege(role_name,format('public.%I',c.tablename),'REFERENCES') THEN
    RAISE EXCEPTION 'Maintenance privilege remains: % %',role_name,c.tablename;
   END IF;
  END LOOP;
 END LOOP;
 FOR c IN
  SELECT t.tablename, a.attname first_column FROM pg_tables t
  JOIN pg_class p ON p.relname=t.tablename AND p.relnamespace='public'::regnamespace
  JOIN pg_attribute a ON a.attrelid=p.oid AND a.attnum=1
  WHERE t.schemaname='public' AND t.tablename NOT IN (SELECT table_name FROM audit_cases)
 LOOP
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   EXECUTE format('SET LOCAL ROLE %I',role_name);
   BEGIN
    EXECUTE format('INSERT INTO public.%I DEFAULT VALUES',c.tablename);
    RAISE EXCEPTION 'Catalogue INSERT privilege: % %',role_name,c.tablename;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   BEGIN
    EXECUTE format('UPDATE public.%I SET %I=%I WHERE false',c.tablename,c.first_column,c.first_column);
    RAISE EXCEPTION 'Catalogue UPDATE privilege: % %',role_name,c.tablename;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   BEGIN
    EXECUTE format('DELETE FROM public.%I WHERE false',c.tablename);
    RAISE EXCEPTION 'Catalogue DELETE privilege: % %',role_name,c.tablename;
   EXCEPTION WHEN insufficient_privilege THEN NULL; END;
   RESET ROLE;
  END LOOP;
 END LOOP;
 DELETE FROM auth.users WHERE id=b;
 FOR c IN SELECT * FROM audit_cases LOOP
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I=$1',c.table_name,c.owner_column) INTO n USING b;
  IF n <> 0 THEN RAISE EXCEPTION 'Account deletion left data: %',c.table_name; END IF;
 END LOOP;
END $$;
ROLLBACK;
SELECT 'PASS: six user tables, A/B/anon CRUD denial, owner reads, ownership transfer denied, catalogue write denial, account deletion cascades, maintenance privileges absent; synthetic fixtures rolled back' result;

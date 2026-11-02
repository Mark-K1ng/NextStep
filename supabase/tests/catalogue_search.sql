-- Public reference data only. No account or fixture records are written.
BEGIN;
DO $$ BEGIN
  ASSERT NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.search_catalogue(text,text,text,text,integer,integer)'::regprocedure), 'Search must respect caller RLS';
  ASSERT NOT has_function_privilege('anon','public.search_catalogue(text,text,text,text,integer,integer)','EXECUTE'), 'Anonymous RPC access';
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE target public.schools; page1 jsonb; page2 jsonb;
BEGIN
  SELECT * INTO target FROM public.schools WHERE county='Bihor' ORDER BY id OFFSET 20 LIMIT 1;
  ASSERT target.id IS NOT NULL, 'Expected reviewed catalogue';
  ASSERT EXISTS(SELECT 1 FROM public.search_catalogue('schools',target.name,'','Bihor',0,21) item WHERE item->>'id'=target.id::text), 'Must find matches outside the old downloaded page';
  ASSERT NOT EXISTS(SELECT 1 FROM public.search_catalogue('schools','Gojdu','','Cluj',0,21)), 'County leak';
  ASSERT NOT EXISTS(SELECT 1 FROM public.search_catalogue('school_profiles','','','',0,21)), 'Unknown county leak';
  ASSERT (SELECT count(*) FROM public.search_catalogue('school_profiles','stiinte','','Bihor',0,51))=(SELECT count(*) FROM public.search_catalogue('school_profiles','științe','','Bihor',0,51)), 'Diacritics mismatch';
  ASSERT NOT EXISTS(SELECT 1 FROM public.search_catalogue('schools',''' OR 1=1 --','','Bihor',0,21)), 'Search must be literal';
  ASSERT (SELECT count(*) FROM public.search_catalogue('school_profiles','','','Bihor',0,10000))<=51, 'Unbounded page';
  ASSERT NOT EXISTS(SELECT 1 FROM public.search_catalogue('school_profiles','','','Bihor',0,51) item JOIN public.school_profiles p ON p.id=(item->>'id')::uuid WHERE NOT p.is_current), 'Archived profile leak';
  ASSERT NOT EXISTS(SELECT 1 FROM public.search_catalogue('schools','','','Bihor',0,20) a JOIN public.search_catalogue('schools','','','Bihor',20,20) b ON a->>'id'=b->>'id'), 'Page overlap';
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM * FROM public.search_catalogue('schools','','','Bihor',0,21);
    RAISE EXCEPTION 'Anonymous caller unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;

-- Publication regression: archived resources cannot leak through direct reads,
-- catalogue search or the server-owned recommendation projection.
-- All fixtures and mutations roll back.
BEGIN;
INSERT INTO public.courses(id,title,provider,url,language,is_free,level,source_url,verified_at,is_current)
VALUES ('da1516ff-25b7-419e-97af-ece429d66eed','Catalogue archive fixture','Test','https://example.invalid/','Test',false,'Test','https://example.invalid/',now(),false);
SELECT account_private.refresh_education_catalogue();
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.education_catalogue WHERE id='da1516ff-25b7-419e-97af-ece429d66eed') THEN
    RAISE EXCEPTION 'Archived course leaked into recommendation candidates';
  END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE id='da1516ff-25b7-419e-97af-ece429d66eed') THEN
    RAISE EXCEPTION 'Archived course leaked through authenticated RLS';
  END IF;
  IF EXISTS (SELECT 1 FROM public.search_catalogue('courses','Catalogue archive fixture','','',0,21)) THEN
    RAISE EXCEPTION 'Archived course leaked through catalogue search';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id='f4598f3d-c685-4ca8-9113-d1a21b2734bb') THEN
    RAISE EXCEPTION 'Verified SQLBolt resource became unreadable';
  END IF;
  BEGIN
    UPDATE public.courses SET is_current=true WHERE id='da1516ff-25b7-419e-97af-ece429d66eed';
    IF FOUND THEN RAISE EXCEPTION 'Client can republish an archived course'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.courses(id,title,provider,url,language,is_free,level,is_current)
    VALUES ('d5bc31e7-c243-4770-8682-8de638a1410b','Unreviewed client course','Test','https://example.invalid/','Test',false,'Test',true);
    RAISE EXCEPTION 'Client can create a published course';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE id='da1516ff-25b7-419e-97af-ece429d66eed') THEN
    RAISE EXCEPTION 'Archived course leaked through anonymous RLS';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;

-- Signup must not depend on the obsolete trigger's invented location.
-- Use synthetic, rolled-back data; profile creation belongs to registration.
BEGIN;
DO $$
DECLARE owner_id uuid := gen_random_uuid(); affected integer;
BEGIN
 IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass
   AND tgname='on_auth_user_created' AND NOT tgisinternal) THEN
   RAISE EXCEPTION 'Legacy signup trigger still installed';
 END IF;
 INSERT INTO auth.users(id,aud,role,email_confirmed_at)
 VALUES(owner_id,'authenticated','authenticated',now());
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 SET LOCAL ROLE authenticated;
 -- Reproduce the old update-only path: a missing profile stays missing.
 UPDATE public.profiles SET display_name='Signup fixture' WHERE id=owner_id;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected <> 0 THEN RAISE EXCEPTION 'Expected missing profile fixture'; END IF;
 INSERT INTO public.profiles(id,display_name,grade_level,county,sector,interests,favorite_subjects)
 VALUES(owner_id,'Signup fixture','VIII','Bihor',NULL,'{}','{}')
 ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name;
 INSERT INTO public.profiles(id,display_name,grade_level,county,sector,interests,favorite_subjects)
 VALUES(owner_id,'Signup fixture retry','VIII','Bihor',NULL,'{}','{}')
 ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name;
 IF (SELECT count(*) FROM public.profiles WHERE id=owner_id) <> 1
 OR (SELECT display_name FROM public.profiles WHERE id=owner_id) <> 'Signup fixture retry'
 THEN RAISE EXCEPTION 'Owner profile upsert/retry failed'; END IF;
 -- The fixed selectors' București value must retain the submitted sector.
 UPDATE public.profiles SET county='București',sector=6 WHERE id=owner_id;
 IF (SELECT sector FROM public.profiles WHERE id=owner_id) <> 6 THEN
   RAISE EXCEPTION 'Submitted sector was not retained';
 END IF;
 BEGIN
   UPDATE public.profiles SET sector=NULL WHERE id=owner_id;
   RAISE EXCEPTION 'București accepted without a sector';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 UPDATE public.profiles SET county='Bihor',sector=NULL WHERE id=owner_id;
 RESET ROLE;
END $$;
ROLLBACK;
SELECT 'PASS: update-only missing-profile bug reproduced; authenticated owner upsert and retry succeed; synthetic account rolled back' result;

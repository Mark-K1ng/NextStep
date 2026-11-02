-- Export's favorites query must work on migrated databases and remain owner-only.
-- All fixtures are synthetic and rolled back; no account is deleted.
BEGIN;
DO $$
DECLARE
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  item uuid := gen_random_uuid();
  affected integer;
BEGIN
  INSERT INTO auth.users(id,aud,role,email_confirmed_at)
    VALUES(owner_id,'authenticated','authenticated',now());
  INSERT INTO public.profiles(id,display_name,grade_level,county,interests,favorite_subjects)
    VALUES(owner_id,'Export fixture','VIII','Bihor','{}','{}');
  PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.user_favorites(user_id,item_id,item_type)
    VALUES(owner_id,item,'school');
  IF (SELECT count(*) FROM public.user_favorites WHERE user_id=owner_id AND item_id=item) <> 1 THEN
    RAISE EXCEPTION 'Owner export cannot read the saved favorite';
  END IF;
  PERFORM set_config('request.jwt.claim.sub',other_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
  IF EXISTS (SELECT 1 FROM public.user_favorites WHERE user_id=owner_id) THEN
    RAISE EXCEPTION 'Another account can export the owner favorites';
  END IF;
  DELETE FROM public.user_favorites WHERE user_id=owner_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Another account can remove the owner favorites'; END IF;
  BEGIN
    INSERT INTO public.user_favorites(user_id,item_id,item_type)
      VALUES(owner_id,gen_random_uuid(),'school');
    RAISE EXCEPTION 'Another account can write owner favorites';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub','',true);
  PERFORM set_config('request.jwt.claims','{}',true);
  BEGIN
    PERFORM 1 FROM public.user_favorites;
    RAISE EXCEPTION 'Anonymous export unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END;
$$;
ROLLBACK;
SELECT 'PASS: favorites export works for owner; cross-account read/write/delete and anonymous read denied; fixtures rolled back' result;

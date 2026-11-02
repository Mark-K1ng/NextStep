-- Run against the configured database after restore_path_write_permissions.
-- Uses an existing profile only as an FK target. Every test write is rolled back.
BEGIN;
DO $$
DECLARE
  owner_id uuid;
  other_id uuid := gen_random_uuid();
  school_id uuid;
  probe_id uuid := gen_random_uuid();
  goal_probe_id uuid := gen_random_uuid();
  career_id uuid;
  affected integer;
BEGIN
  SELECT id INTO owner_id FROM public.profiles ORDER BY id LIMIT 1;
  SELECT id INTO career_id FROM public.careers LIMIT 1;
  SELECT s.id INTO school_id FROM public.schools s
    WHERE s.county = 'Bihor' AND NOT EXISTS (
      SELECT 1 FROM public.user_progress p
      WHERE p.user_id = owner_id AND p.step_type = 'school' AND p.ref_id = s.id
    ) LIMIT 1;
  IF owner_id IS NULL OR school_id IS NULL OR career_id IS NULL THEN
    RAISE EXCEPTION 'Test requires an existing profile and an unselected Bihor school';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  INSERT INTO public.user_goals(id,user_id,career_id)
    VALUES(goal_probe_id,owner_id,career_id);

  INSERT INTO public.user_progress(id,user_id,step_type,ref_id,status)
    VALUES (probe_id,owner_id,'school',school_id,'in_progress');
  IF NOT EXISTS (
    SELECT 1 FROM public.user_progress p JOIN public.schools s ON s.id=p.ref_id
    WHERE p.id=probe_id AND p.user_id=owner_id AND s.county='Bihor'
  ) THEN RAISE EXCEPTION 'Owner cannot reload the saved school'; END IF;

  UPDATE public.user_progress SET status='completed' WHERE id=probe_id;
  INSERT INTO public.user_progress(user_id,step_type,ref_id,status)
    VALUES (owner_id,'school',school_id,'in_progress')
    ON CONFLICT(user_id,step_type,ref_id) DO NOTHING;
  IF (SELECT count(*) FROM public.user_progress WHERE user_id=owner_id AND step_type='school' AND ref_id=school_id) <> 1
     OR (SELECT status FROM public.user_progress WHERE id=probe_id) <> 'completed' THEN
    RAISE EXCEPTION 'Repeated save duplicated or reset progress';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', other_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',other_id,'role','authenticated')::text, true);
  IF EXISTS (SELECT 1 FROM public.user_progress WHERE id=probe_id) THEN
    RAISE EXCEPTION 'Another account can read the saved school';
  END IF;
  DELETE FROM public.user_goals WHERE id=goal_probe_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Another account can remove the career objective'; END IF;
  UPDATE public.user_progress SET status='not_started' WHERE id=probe_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Another account can update the saved school'; END IF;
  DELETE FROM public.user_progress WHERE id=probe_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Another account can remove the saved school'; END IF;
  BEGIN
    INSERT INTO public.user_progress(user_id,step_type,ref_id,status)
      VALUES (owner_id,'school',gen_random_uuid(),'in_progress');
    RAISE EXCEPTION 'Another account can write under the owner ID';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub','',true);
  PERFORM set_config('request.jwt.claims','{}',true);
  BEGIN
    INSERT INTO public.user_progress(user_id,step_type,ref_id,status)
      VALUES (owner_id,'school',gen_random_uuid(),'in_progress');
    RAISE EXCEPTION 'Anonymous saving unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  DELETE FROM public.user_goals WHERE id=goal_probe_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Owner cannot remove the career objective'; END IF;
  DELETE FROM public.user_progress WHERE id=probe_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Owner cannot remove the saved school'; END IF;
  RESET ROLE;
END;
$$;
ROLLBACK;
SELECT 'PASS: owner save/reload/update/remove, idempotent upsert, cross-account isolation, anonymous write denial; all fixture writes rolled back' AS result;

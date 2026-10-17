-- RLS Test Suite for NextStep
-- This file tests Row Level Security policies to ensure data isolation

-- Setup: Create test users
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
BEGIN
  -- Create test user A
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'test_a@example.com', 'hashed_password', NOW())
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user_a_id;

  -- Create test user B
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'test_b@example.com', 'hashed_password', NOW())
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user_b_id;

  -- Create profiles for test users
  INSERT INTO profiles (id, display_name, grade_level, county, interests, favorite_subjects)
  VALUES (user_a_id, 'Test User A', 'IX', 'București', ARRAY['tehnologie'], ARRAY['informatica'])
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, display_name, grade_level, county, interests, favorite_subjects)
  VALUES (user_b_id, 'Test User B', 'X', 'Cluj', ARRAY['stiinta'], ARRAY['matematica'])
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test users created: A=%, B=%', user_a_id, user_b_id;
END $$;

-- Test 1: Anonymous users cannot read user tables
DO $$
DECLARE
  can_read BOOLEAN;
BEGIN
  -- Set role to anon
  SET ROLE anon;

  -- Try to read profiles table
  BEGIN
    PERFORM 1 FROM profiles LIMIT 1;
    can_read := true;
  EXCEPTION WHEN others THEN
    can_read := false;
  END;

  IF can_read THEN
    RAISE EXCEPTION 'FAIL: Anonymous users can read profiles table';
  ELSE
    RAISE NOTICE 'PASS: Anonymous users cannot read profiles table';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 2: User A cannot read User B's profile
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  can_read BOOLEAN;
BEGIN
  -- Get test user IDs
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'test_b@example.com';

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to read user B's profile
  BEGIN
    PERFORM 1 FROM profiles WHERE id = user_b_id;
    can_read := true;
  EXCEPTION WHEN others THEN
    can_read := false;
  END;

  IF can_read THEN
    RAISE EXCEPTION 'FAIL: User A can read User B''s profile';
  ELSE
    RAISE NOTICE 'PASS: User A cannot read User B''s profile';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 3: User A can read their own profile
DO $$
DECLARE
  user_a_id UUID;
  can_read BOOLEAN;
BEGIN
  -- Get test user ID
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to read own profile
  BEGIN
    PERFORM 1 FROM profiles WHERE id = user_a_id;
    can_read := true;
  EXCEPTION WHEN others THEN
    can_read := false;
  END;

  IF NOT can_read THEN
    RAISE EXCEPTION 'FAIL: User A cannot read their own profile';
  ELSE
    RAISE NOTICE 'PASS: User A can read their own profile';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 4: User A cannot insert into User B's profile
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  can_insert BOOLEAN;
BEGIN
  -- Get test user IDs
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'test_b@example.com';

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to insert into user B's profile
  BEGIN
    INSERT INTO profiles (id, display_name, grade_level, county, interests, favorite_subjects)
    VALUES (user_b_id, 'Hacked', 'IX', 'București', ARRAY['hacking'], ARRAY['hacking']);
    can_insert := true;
  EXCEPTION WHEN others THEN
    can_insert := false;
  END;

  IF can_insert THEN
    RAISE EXCEPTION 'FAIL: User A can insert into User B''s profile';
  ELSE
    RAISE NOTICE 'PASS: User A cannot insert into User B''s profile';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 5: User A cannot update User B's profile
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  can_update BOOLEAN;
BEGIN
  -- Get test user IDs
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'test_b@example.com';

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to update user B's profile
  BEGIN
    UPDATE profiles SET display_name = 'Hacked' WHERE id = user_b_id;
    can_update := true;
  EXCEPTION WHEN others THEN
    can_update := false;
  END;

  IF can_update THEN
    RAISE EXCEPTION 'FAIL: User A can update User B''s profile';
  ELSE
    RAISE NOTICE 'PASS: User A cannot update User B''s profile';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 6: User A cannot delete User B's profile
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  can_delete BOOLEAN;
BEGIN
  -- Get test user IDs
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'test_b@example.com';

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to delete user B's profile
  BEGIN
    DELETE FROM profiles WHERE id = user_b_id;
    can_delete := true;
  EXCEPTION WHEN others THEN
    can_delete := false;
  END;

  IF can_delete THEN
    RAISE EXCEPTION 'FAIL: User A can delete User B''s profile';
  ELSE
    RAISE NOTICE 'PASS: User A cannot delete User B''s profile';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 7: Authenticated users can read reference tables
DO $$
DECLARE
  can_read BOOLEAN;
BEGIN
  -- Set role to authenticated
  SET ROLE authenticated;

  -- Try to read schools table
  BEGIN
    PERFORM 1 FROM schools LIMIT 1;
    can_read := true;
  EXCEPTION WHEN others THEN
    can_read := false;
  END;

  IF NOT can_read THEN
    RAISE EXCEPTION 'FAIL: Authenticated users cannot read schools table';
  ELSE
    RAISE NOTICE 'PASS: Authenticated users can read schools table';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 8: Authenticated users cannot insert into reference tables
DO $$
DECLARE
  can_insert BOOLEAN;
BEGIN
  -- Set role to authenticated
  SET ROLE authenticated;

  -- Try to insert into schools table
  BEGIN
    INSERT INTO schools (name, city, county, website, description, source_url, verified_at)
    VALUES ('Test School', 'Test City', 'Test County', 'https://test.com', 'Test', 'https://test.com', NOW());
    can_insert := true;
  EXCEPTION WHEN others THEN
    can_insert := false;
  END;

  IF can_insert THEN
    RAISE EXCEPTION 'FAIL: Authenticated users can insert into schools table';
  ELSE
    RAISE NOTICE 'PASS: Authenticated users cannot insert into schools table';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 9: User A cannot read User B's user_skills
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  can_read BOOLEAN;
BEGIN
  -- Get test user IDs
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'test_b@example.com';

  -- Insert a skill for user B
  INSERT INTO user_skills (user_id, skill_id, level)
  SELECT user_b_id, id, 2 FROM skills LIMIT 1
  ON CONFLICT DO NOTHING;

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to read user B's skills
  BEGIN
    PERFORM 1 FROM user_skills WHERE user_id = user_b_id;
    can_read := true;
  EXCEPTION WHEN others THEN
    can_read := false;
  END;

  IF can_read THEN
    RAISE EXCEPTION 'FAIL: User A can read User B''s user_skills';
  ELSE
    RAISE NOTICE 'PASS: User A cannot read User B''s user_skills';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Test 10: User A cannot read User B's user_goals
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  can_read BOOLEAN;
BEGIN
  -- Get test user IDs
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'test_a@example.com';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'test_b@example.com';

  -- Insert a goal for user B
  INSERT INTO user_goals (user_id, career_id)
  SELECT user_b_id, id FROM careers LIMIT 1
  ON CONFLICT DO NOTHING;

  -- Set role to authenticated as user A
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claim.sub = user_a_id::text;

  -- Try to read user B's goals
  BEGIN
    PERFORM 1 FROM user_goals WHERE user_id = user_b_id;
    can_read := true;
  EXCEPTION WHEN others THEN
    can_read := false;
  END;

  IF can_read THEN
    RAISE EXCEPTION 'FAIL: User A can read User B''s user_goals';
  ELSE
    RAISE NOTICE 'PASS: User A cannot read User B''s user_goals';
  END IF;

  -- Reset role
  RESET ROLE;
END $$;

-- Cleanup: Remove test users
DO $$
BEGIN
  DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com');
  DELETE FROM user_skills WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com');
  DELETE FROM user_goals WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com');
  DELETE FROM auth.users WHERE email LIKE 'test_%@example.com';

  RAISE NOTICE 'Test users cleaned up';
END $$;

RAISE NOTICE 'RLS Test Suite Completed';

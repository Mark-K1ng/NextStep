-- Registration already upserts the validated profile after authentication in
-- completeRegistration(). The legacy trigger invents a București location with
-- no sector and violates profiles_sector_choice on every auth.users insert.
-- Match the deployed database: no profile is fabricated before onboarding.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Table grants alone do not permit deletion through RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'user_goals'
      AND policyname = 'Users can delete their own goals'
  ) THEN
    CREATE POLICY "Users can delete their own goals"
      ON public.user_goals FOR DELETE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END;
$$;
GRANT SELECT, INSERT, DELETE ON public.user_goals TO authenticated;

-- This table already exists in the deployed database and is part of data export,
-- but was missing from migration history. Preserve it and all existing favorites.
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('school','university','career','course')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, item_id, item_type)
);
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_favorites FROM anon;
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'user_favorites'
      AND policyname = 'Users can view their own favorites'
  ) THEN
    CREATE POLICY "Users can view their own favorites"
      ON public.user_favorites FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'user_favorites'
      AND policyname = 'Users can insert their own favorites'
  ) THEN
    CREATE POLICY "Users can insert their own favorites"
      ON public.user_favorites FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'user_favorites'
      AND policyname = 'Users can delete their own favorites'
  ) THEN
    CREATE POLICY "Users can delete their own favorites"
      ON public.user_favorites FOR DELETE TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END;
$$;

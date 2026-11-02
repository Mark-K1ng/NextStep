-- Policies alone do not grant Data API write access. Keep access owner-scoped
-- through the existing auth.uid() = user_id policies; never grant anonymous writes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('user_progress', 'user_goals')
      AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Path tables must have RLS enabled before granting writes';
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_progress TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_goals TO authenticated;

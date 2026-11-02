-- The mobile self-assessment uses an owner-scoped, atomic upsert (levels 1–3)
-- and DELETE for Neevaluat. RLS and the student_account_writes trigger remain
-- authoritative; anonymous clients receive no write privileges.
grant insert, update, delete on table public.user_skills to authenticated;

ALTER TABLE public.school_profiles
  ADD COLUMN IF NOT EXISTS admission_year smallint CHECK (admission_year BETWEEN 2000 AND 2100),
  ADD COLUMN IF NOT EXISTS admission_code text,
  ADD COLUMN IF NOT EXISTS seats_total integer CHECK (seats_total >= 0),
  ADD COLUMN IF NOT EXISTS seats_occupied integer CHECK (seats_occupied >= 0 AND seats_occupied <= seats_total),
  ADD COLUMN IF NOT EXISTS last_admission_average numeric(4,2) CHECK (last_admission_average BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS previous_admission_average numeric(4,2) CHECK (previous_admission_average BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS teaching_language text,
  ADD COLUMN IF NOT EXISTS bilingual_language text,
  ADD COLUMN IF NOT EXISTS is_dual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS study_form text,
  ADD COLUMN IF NOT EXISTS pathway text,
  ADD COLUMN IF NOT EXISTS subjects_source_url text,
  ADD COLUMN IF NOT EXISTS subjects_note text,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS school_profiles_year_code
  ON public.school_profiles(school_id, admission_year, admission_code);
-- Catalogue remains read-only for app clients under existing RLS policies.

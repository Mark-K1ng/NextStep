-- Catalogue provenance only; existing RLS and grants remain in force.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS address_source_url text,
  ADD COLUMN IF NOT EXISTS address_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_note text,
  ADD COLUMN IF NOT EXISTS website_source_url text,
  ADD COLUMN IF NOT EXISTS website_verified_at timestamptz;

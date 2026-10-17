-- Enable RLS on reference tables (schools, school_profiles, skills, careers, career_skills, courses)
-- This migration was applied directly to the database during security audit
-- These tables already have RLS policies defined in 001_init_schema.sql
-- Placeholder for version control sync

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

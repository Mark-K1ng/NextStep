-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reference tables (public read-only)

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  website TEXT,
  description TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School profiles/specializations table
CREATE TABLE school_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  track TEXT NOT NULL, -- e.g., "Real", "Teoretic", "Vocational"
  specialization TEXT NOT NULL,
  key_subjects TEXT[] NOT NULL DEFAULT '{}',
  admission_notes TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universities table
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  website TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- University programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  degree_level TEXT NOT NULL CHECK (degree_level IN ('bachelor', 'master', 'phd', 'associate')),
  duration_years INTEGER NOT NULL CHECK (duration_years > 0 AND duration_years <= 10),
  description TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL
);

-- Careers table
CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career skills junction table (many-to-many with importance)
CREATE TABLE career_skills (
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance SMALLINT NOT NULL CHECK (importance >= 1 AND importance <= 3),
  PRIMARY KEY (career_id, skill_id)
);

-- Program skills junction table (many-to-many with depth)
CREATE TABLE program_skills (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  depth SMALLINT NOT NULL CHECK (depth >= 1 AND depth <= 3),
  PRIMARY KEY (program_id, skill_id)
);

-- Program careers junction table (many-to-many)
CREATE TABLE program_careers (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, career_id)
);

-- School profile programs junction table (many-to-many)
CREATE TABLE school_profile_programs (
  school_profile_id UUID NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  PRIMARY KEY (school_profile_id, program_id)
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course skills junction table (many-to-many with depth)
CREATE TABLE course_skills (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  depth SMALLINT NOT NULL CHECK (depth >= 1 AND depth <= 3),
  PRIMARY KEY (course_id, skill_id)
);

-- User-owned tables

-- Profiles table (one-to-one with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII')),
  county TEXT NOT NULL,
  interests TEXT[] NOT NULL DEFAULT '{}',
  favorite_subjects TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skills table (many-to-many with proficiency level)
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level >= 1 AND level <= 3),
  PRIMARY KEY (user_id, skill_id)
);

-- User goals table (one user can have multiple goals over time)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table (tracks steps toward goals)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('school', 'program', 'course', 'skill')),
  ref_id UUID NOT NULL, -- References the appropriate table based on step_type
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consents table (for minors and data processing)
CREATE TABLE consents (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('data_processing', 'marketing', 'third_party_sharing')),
  granted_at TIMESTAMPTZ NOT NULL,
  version TEXT NOT NULL
);

-- Create indexes for foreign keys and commonly queried columns
CREATE INDEX idx_schools_county ON schools(county);
CREATE INDEX idx_school_profiles_school_id ON school_profiles(school_id);
CREATE INDEX idx_school_profiles_track ON school_profiles(track);
CREATE INDEX idx_programs_university_id ON programs(university_id);
CREATE INDEX idx_programs_degree_level ON programs(degree_level);
CREATE INDEX idx_careers_domain ON careers(domain);
CREATE INDEX idx_career_skills_career_id ON career_skills(career_id);
CREATE INDEX idx_career_skills_skill_id ON career_skills(skill_id);
CREATE INDEX idx_program_skills_program_id ON program_skills(program_id);
CREATE INDEX idx_program_skills_skill_id ON program_skills(skill_id);
CREATE INDEX idx_program_careers_program_id ON program_careers(program_id);
CREATE INDEX idx_program_careers_career_id ON program_careers(career_id);
CREATE INDEX idx_school_profile_programs_school_profile_id ON school_profile_programs(school_profile_id);
CREATE INDEX idx_school_profile_programs_program_id ON school_profile_programs(program_id);
CREATE INDEX idx_courses_provider ON courses(provider);
CREATE INDEX idx_courses_language ON courses(language);
CREATE INDEX idx_courses_is_free ON courses(is_free);
CREATE INDEX idx_course_skills_course_id ON course_skills(course_id);
CREATE INDEX idx_course_skills_skill_id ON course_skills(skill_id);
CREATE INDEX idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX idx_profiles_county ON profiles(county);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_career_id ON user_goals(career_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_step_type ON user_progress(step_type);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_consents_kind ON consents(kind);

-- Enable Row Level Security on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_profile_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reference tables (select only for authenticated users)
CREATE POLICY "Allow select for authenticated users on schools"
  ON schools FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on school_profiles"
  ON school_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on universities"
  ON universities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on programs"
  ON programs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on skills"
  ON skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on careers"
  ON careers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on career_skills"
  ON career_skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on program_skills"
  ON program_skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on program_careers"
  ON program_careers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on school_profile_programs"
  ON school_profile_programs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on courses"
  ON courses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users on course_skills"
  ON course_skills FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for user-owned tables (user-specific access)
CREATE POLICY "Allow users to insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert their own user_skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own user_skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own user_skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own user_skills"
  ON user_skills FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own user_goals"
  ON user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own user_goals"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own user_progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own user_progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own user_progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own user_progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to manage their own consents"
  ON consents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically create profile when auth user is created
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, grade_level, county, interests, favorite_subjects)
  VALUES (NEW.id, NEW.email, 'V', 'București', '{}', '{}')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reference tables (public read-only)

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  website TEXT,
  description TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_county ON schools(county);
CREATE INDEX idx_schools_city ON schools(city);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools are viewable by authenticated users"
  ON schools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Schools cannot be modified by clients"
  ON schools FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE school_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  track TEXT NOT NULL,
  specialization TEXT NOT NULL,
  key_subjects TEXT[] NOT NULL,
  admission_notes TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_school_profiles_school_id ON school_profiles(school_id);
CREATE INDEX idx_school_profiles_track ON school_profiles(track);

ALTER TABLE school_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School profiles are viewable by authenticated users"
  ON school_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "School profiles cannot be modified by clients"
  ON school_profiles FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  website TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_universities_city ON universities(city);

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by authenticated users"
  ON universities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Universities cannot be modified by clients"
  ON universities FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  degree_level TEXT NOT NULL,
  duration_years INTEGER NOT NULL CHECK (duration_years > 0),
  description TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_programs_university_id ON programs(university_id);
CREATE INDEX idx_programs_degree_level ON programs(degree_level);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Programs are viewable by authenticated users"
  ON programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Programs cannot be modified by clients"
  ON programs FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are viewable by authenticated users"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Skills cannot be modified by clients"
  ON skills FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_careers_domain ON careers(domain);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Careers are viewable by authenticated users"
  ON careers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Careers cannot be modified by clients"
  ON careers FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE career_skills (
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance SMALLINT NOT NULL CHECK (importance >= 1 AND importance <= 3),
  PRIMARY KEY (career_id, skill_id)
);

CREATE INDEX idx_career_skills_career_id ON career_skills(career_id);
CREATE INDEX idx_career_skills_skill_id ON career_skills(skill_id);

ALTER TABLE career_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Career skills are viewable by authenticated users"
  ON career_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Career skills cannot be modified by clients"
  ON career_skills FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE program_skills (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  depth SMALLINT NOT NULL CHECK (depth >= 1 AND depth <= 3),
  PRIMARY KEY (program_id, skill_id)
);

CREATE INDEX idx_program_skills_program_id ON program_skills(program_id);
CREATE INDEX idx_program_skills_skill_id ON program_skills(skill_id);

ALTER TABLE program_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Program skills are viewable by authenticated users"
  ON program_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Program skills cannot be modified by clients"
  ON program_skills FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE program_careers (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, career_id)
);

CREATE INDEX idx_program_careers_program_id ON program_careers(program_id);
CREATE INDEX idx_program_careers_career_id ON program_careers(career_id);

ALTER TABLE program_careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Program careers are viewable by authenticated users"
  ON program_careers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Program careers cannot be modified by clients"
  ON program_careers FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE school_profile_programs (
  school_profile_id UUID NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  PRIMARY KEY (school_profile_id, program_id)
);

CREATE INDEX idx_school_profile_programs_school_profile_id ON school_profile_programs(school_profile_id);
CREATE INDEX idx_school_profile_programs_program_id ON school_profile_programs(program_id);

ALTER TABLE school_profile_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School profile programs are viewable by authenticated users"
  ON school_profile_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "School profile programs cannot be modified by clients"
  ON school_profile_programs FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT true,
  level TEXT,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_is_free ON courses(is_free);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_language ON courses(language);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are viewable by authenticated users"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Courses cannot be modified by clients"
  ON courses FOR ALL
  TO authenticated
  WITH CHECK (false);

CREATE TABLE course_skills (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  depth SMALLINT NOT NULL CHECK (depth >= 1 AND depth <= 3),
  PRIMARY KEY (course_id, skill_id)
);

CREATE INDEX idx_course_skills_course_id ON course_skills(course_id);
CREATE INDEX idx_course_skills_skill_id ON course_skills(skill_id);

ALTER TABLE course_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course skills are viewable by authenticated users"
  ON course_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Course skills cannot be modified by clients"
  ON course_skills FOR ALL
  TO authenticated
  WITH CHECK (false);

-- User-owned tables

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'student')),
  county TEXT NOT NULL,
  interests TEXT[] NOT NULL,
  favorite_subjects TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX idx_profiles_county ON profiles(county);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, grade_level, county, interests, favorite_subjects)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Utilizator'),
    COALESCE(NEW.raw_user_meta_data->>'grade_level', 'IX'),
    COALESCE(NEW.raw_user_meta_data->>'county', 'București'),
    COALESCE(NEW.raw_user_meta_data->>'interests', ARRAY['tehnologie']::TEXT[]),
    COALESCE(NEW.raw_user_meta_data->>'favorite_subjects', ARRAY['informatica']::TEXT[])
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level >= 1 AND level <= 3),
  PRIMARY KEY (user_id, skill_id)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills"
  ON user_skills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON user_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON user_skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON user_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_career_id ON user_goals(career_id);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
  ON user_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON user_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON user_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON user_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL,
  ref_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON user_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE consents (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version TEXT NOT NULL,
  PRIMARY KEY (user_id, kind)
);

CREATE INDEX idx_consents_user_id ON consents(user_id);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consents"
  ON consents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

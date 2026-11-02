export interface Profile {
  id: string;
  display_name: string;
  grade_level: string;
  county: string;
  sector?: number | null;
  interests: string[];
  favorite_subjects: string[];
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface Career {
  id: string;
  name: string;
  domain: string;
  description?: string;
  source_url?: string;
}

export interface ProgramRaw {
  id: string;
  name: string;
  degree_level: string;
  duration_years: number;
  description?: string;
  source_url?: string;
  universities?: { id: string; name: string };
  program_skills?: { skills: Skill }[];
  program_careers?: { careers: Career }[];
}

export interface ProgramDisplay {
  id: string;
  name: string;
  university: string;
  degreeLevel: string;
  duration: string;
  description: string;
  sourceUrl: string;
  skills: Skill[];
  careers: Career[];
}

export interface SchoolRaw {
  id: string;
  name: string;
  city: string;
  county: string;
  website?: string;
  description?: string;
  source_url?: string;
  school_profiles?: {
    specialization: string;
    key_subjects: string[];
    admission_notes?: string;
    school_profile_programs?: { programs: ProgramRaw }[];
  }[];
}

export interface CourseRaw {
  id: string;
  title: string;
  provider: string;
  url: string;
  language: string;
  is_free: boolean;
  level: string;
  source_url?: string;
  course_skills?: { skill_id: string; depth: 1 | 2 | 3; skills: Skill }[];
}

export interface PathStep {
  refId?: string;
  id: string;
  type: 'school' | 'university' | 'career' | 'skill' | 'program' | 'course';
  status: 'not_started' | 'in_progress' | 'completed';
  name?: string;
  title?: string;
  description?: string;
  specialization?: string;
  domain?: string;
  level?: number;
  degreeLevel?: string;
  duration?: string;
  provider?: string;
  language?: string;
}

export interface ExploreRaw extends Partial<SchoolRaw>, Partial<CourseRaw> {
  id: string;
  name?: string;
  domain?: string;
  programs?: ProgramRaw[];
}

export interface ExploreItem {
  /** Legacy cache migration metadata; not current path membership. */
  pathSynced?: boolean;
  verifiedAt?: string;
  track?: string;
  subjects?: string[];
  id: string;
  type: string;
  name?: string;
  title?: string;
  description?: string;
  specialization?: string;
  provider?: string;
  domain?: string;
  degreeLevel?: string;
  duration?: string;
  county?: string;
  language?: string;
  isFree?: boolean;
  level?: string;
  sourceUrl?: string;
}

/**
 * Data models for the NextStep application
 * These types represent the database schema and API responses
 */

/**
 * School model
 */
export interface School {
  id: string;
  name: string;
  city: string;
  county: string;
  website?: string;
  description?: string;
  source_url: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * School profile model
 */
export interface SchoolProfile {
  id: string;
  school_id: string;
  track: string;
  specialization: string;
  key_subjects: string[];
  admission_notes?: string;
  source_url: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * University model
 */
export interface University {
  id: string;
  name: string;
  city: string;
  website?: string;
  source_url: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Program model
 */
export interface Program {
  id: string;
  university_id: string;
  name: string;
  degree_level: string;
  duration_years: number;
  description?: string;
  source_url: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Skill model
 */
export interface Skill {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

/**
 * Career model
 */
export interface Career {
  id: string;
  name: string;
  description?: string;
  domain: string;
  source_url: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Course model
 */
export interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  language: string;
  is_free: boolean;
  level?: string;
  source_url: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * User profile model
 */
export interface Profile {
  id: string;
  display_name: string;
  grade_level: string;
  county: string;
  interests: string[];
  favorite_subjects: string[];
  created_at: string;
  updated_at: string;
}

/**
 * User skill model
 */
export interface UserSkill {
  user_id: string;
  skill_id: string;
  level: number;
}

/**
 * User goal model
 */
export interface UserGoal {
  id: string;
  user_id: string;
  career_id: string;
  created_at: string;
}

/**
 * User progress model
 */
export interface UserProgress {
  id: string;
  user_id: string;
  step_type: string;
  ref_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  updated_at: string;
}

/**
 * Consent model
 */
export interface Consent {
  user_id: string;
  kind: string;
  granted_at: string;
  version: string;
}

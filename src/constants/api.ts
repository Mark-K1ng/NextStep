/**
 * API endpoints and Supabase configuration
 */

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Edge function endpoints
 */
export const EDGE_FUNCTIONS = {
  EXPLAIN_PATH: 'explain-path',
  DELETE_ACCOUNT: 'delete-account',
  EXPORT_DATA: 'export-data',
} as const;

/**
 * API routes
 */
export const API_ROUTES = {
  SCHOOLS: '/schools',
  UNIVERSITIES: '/universities',
  PROGRAMS: '/programs',
  CAREERS: '/careers',
  SKILLS: '/skills',
  COURSES: '/courses',
  PROFILES: '/profiles',
  USER_SKILLS: '/user_skills',
  USER_GOALS: '/user_goals',
  USER_PROGRESS: '/user_progress',
} as const;

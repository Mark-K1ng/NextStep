/**
 * API request and response types
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
}

/**
 * Filter options for explore
 */
export interface ExploreFilters {
  county?: string;
  city?: string;
  domain?: string;
  level?: string;
  is_free?: boolean;
  search?: string;
}

/**
 * Gap analysis result
 */
export interface GapAnalysisResult {
  current_level: string;
  target_career: string;
  missing_skills: {
    skill_id: string;
    skill_name: string;
    importance: number;
  }[];
  recommended_courses: {
    course_id: string;
    title: string;
    provider: string;
    url: string;
    skills_covered: string[];
  }[];
}

/**
 * Path step
 */
export interface PathStep {
  id: string;
  type: 'school' | 'university' | 'program' | 'skill' | 'course';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'not_started';
  order: number;
}

/**
 * Edge function response for explain-path
 */
export interface ExplainPathResponse {
  explanation: string;
  confidence: number;
}

/**
 * Courses service
 * Handles course-related API operations
 */

import { ApiClient } from './api';
import { Course, ExploreFilters } from '../types';

/**
 * Fetch a single course by ID
 * @param id - Course ID
 * @returns Course data or error
 */
export async function fetchCourse(id: string) {
  return ApiClient.fetchOne<Course>('courses', id);
}

/**
 * Fetch courses with optional filters
 * @param filters - Optional filters (is_free, level, language, search)
 * @returns Courses array or error
 */
export async function fetchCourses(filters?: ExploreFilters) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.is_free !== null && filters?.is_free !== undefined) {
    queryFilters.is_free = filters.is_free;
  }
  
  if (filters?.level) {
    queryFilters.level = filters.level;
  }
  
  if (filters?.search) {
    queryFilters.title = filters.search;
  }

  return ApiClient.fetchMany<Course>('courses', queryFilters);
}

/**
 * Fetch paginated courses
 * @param filters - Optional filters
 * @param limit - Number of records per page
 * @param cursor - Optional cursor for pagination
 * @returns Paginated courses
 */
export async function fetchCoursesPaginated(
  filters?: ExploreFilters,
  limit = 20,
  cursor?: string
) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.is_free !== null && filters?.is_free !== undefined) {
    queryFilters.is_free = filters.is_free;
  }

  return ApiClient.fetchPaginated<Course>('courses', queryFilters, limit, cursor);
}

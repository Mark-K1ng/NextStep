/**
 * Schools service
 * Handles school-related API operations
 */

import { ApiClient } from './api';
import { School, ExploreFilters } from '../types';

/**
 * Fetch a single school by ID
 * @param id - School ID
 * @returns School data or error
 */
export async function fetchSchool(id: string) {
  return ApiClient.fetchOne<School>('schools', id);
}

/**
 * Fetch schools with optional filters
 * @param filters - Optional filters (county, search)
 * @returns Schools array or error
 */
export async function fetchSchools(filters?: ExploreFilters) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.county) {
    queryFilters.county = filters.county;
  }
  
  if (filters?.search) {
    // For search, we'll need to use Supabase's text search
    // This is a simplified version
    queryFilters.name = filters.search;
  }

  return ApiClient.fetchMany<School>('schools', queryFilters);
}

/**
 * Fetch paginated schools
 * @param filters - Optional filters
 * @param limit - Number of records per page
 * @param cursor - Optional cursor for pagination
 * @returns Paginated schools
 */
export async function fetchSchoolsPaginated(
  filters?: ExploreFilters,
  limit = 20,
  cursor?: string
) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.county) {
    queryFilters.county = filters.county;
  }

  return ApiClient.fetchPaginated<School>('schools', queryFilters, limit, cursor);
}

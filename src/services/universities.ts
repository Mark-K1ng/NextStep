/**
 * Universities service
 * Handles university-related API operations
 */

import { ApiClient } from './api';
import { University, ExploreFilters } from '../types';

/**
 * Fetch a single university by ID
 * @param id - University ID
 * @returns University data or error
 */
export async function fetchUniversity(id: string) {
  return ApiClient.fetchOne<University>('universities', id);
}

/**
 * Fetch universities with optional filters
 * @param filters - Optional filters (city, search)
 * @returns Universities array or error
 */
export async function fetchUniversities(filters?: ExploreFilters) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.county) {
    queryFilters.city = filters.county;
  }
  
  if (filters?.search) {
    queryFilters.name = filters.search;
  }

  return ApiClient.fetchMany<University>('universities', queryFilters);
}

/**
 * Fetch paginated universities
 * @param filters - Optional filters
 * @param limit - Number of records per page
 * @param cursor - Optional cursor for pagination
 * @returns Paginated universities
 */
export async function fetchUniversitiesPaginated(
  filters?: ExploreFilters,
  limit = 20,
  cursor?: string
) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.county) {
    queryFilters.city = filters.county;
  }

  return ApiClient.fetchPaginated<University>('universities', queryFilters, limit, cursor);
}

/**
 * Careers service
 * Handles career-related API operations
 */

import { ApiClient } from './api';
import { Career, ExploreFilters } from '../types';

/**
 * Fetch a single career by ID
 * @param id - Career ID
 * @returns Career data or error
 */
export async function fetchCareer(id: string) {
  return ApiClient.fetchOne<Career>('careers', id);
}

/**
 * Fetch careers with optional filters
 * @param filters - Optional filters (domain, search)
 * @returns Careers array or error
 */
export async function fetchCareers(filters?: ExploreFilters) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.domain) {
    queryFilters.domain = filters.domain;
  }
  
  if (filters?.search) {
    queryFilters.name = filters.search;
  }

  return ApiClient.fetchMany<Career>('careers', queryFilters);
}

/**
 * Fetch paginated careers
 * @param filters - Optional filters
 * @param limit - Number of records per page
 * @param cursor - Optional cursor for pagination
 * @returns Paginated careers
 */
export async function fetchCareersPaginated(
  filters?: ExploreFilters,
  limit = 20,
  cursor?: string
) {
  const queryFilters: Record<string, any> = {};
  
  if (filters?.domain) {
    queryFilters.domain = filters.domain;
  }

  return ApiClient.fetchPaginated<Career>('careers', queryFilters, limit, cursor);
}

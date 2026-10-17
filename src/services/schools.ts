/**
 * Schools service
 * Handles school-related API operations
 */

import { supabase } from '../lib';
import { School, ExploreFilters } from '../types';

export interface SchoolsResponse {
  data: School[];
  error: string | null;
}

/**
 * Fetch a single school by ID
 * @param id - School ID
 * @returns School data or error
 */
export async function fetchSchool(id: string): Promise<{ data: School | null; error: string | null }> {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase nu este configurat' };
    }

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: 'Nu s-a putut încărca școala' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching school:', error);
    return { data: null, error: 'Nu s-a putut încărca școala' };
  }
}

/**
 * Fetch schools with optional filters
 * @param filters - Optional filters (county, search)
 * @returns Schools array or error
 */
export async function fetchSchools(filters?: ExploreFilters) {
  try {
    if (!supabase) {
      return { data: [], error: 'Supabase nu este configurat' };
    }

    let query = supabase.from('schools').select('*');
    
    if (filters?.county) {
      query = query.ilike('county', `%${filters.county}%`);
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching schools:', error);
      return { data: [], error: `Eroare: ${error.message}` };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return { data: [], error: 'Nu s-au putut încărca datele' };
  }
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
  try {
    if (!supabase) {
      return { data: [], has_more: false, next_cursor: undefined };
    }

    let query = supabase.from('schools').select('*', { count: 'exact' }).limit(limit);
    
    if (filters?.county) {
      query = query.ilike('county', `%${filters.county}%`);
    }

    if (cursor) {
      query = query.gt('id', cursor);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: [], has_more: false, next_cursor: undefined };
    }

    const hasMore = count ? data.length < count : false;
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : undefined;

    return {
      data: data || [],
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  } catch (error) {
    console.error('Error fetching paginated schools:', error);
    return { data: [], has_more: false, next_cursor: undefined };
  }
}

/**
 * Universities service
 * Handles university-related API operations
 */

import { supabase } from '../lib';
import { University, ExploreFilters } from '../types';

export interface UniversitiesResponse {
  data: University[];
  error: string | null;
}

/**
 * Fetch a single university by ID
 * @param id - University ID
 * @returns University data or error
 */
export async function fetchUniversity(id: string): Promise<{ data: University | null; error: string | null }> {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase nu este configurat' };
    }

    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: 'Nu s-a putut încărca universitatea' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching university:', error);
    return { data: null, error: 'Nu s-a putut încărca universitatea' };
  }
}

/**
 * Fetch universities with optional filters
 * @param filters - Optional filters (city, search)
 * @returns Universities array or error
 */
export async function fetchUniversities(filters?: ExploreFilters): Promise<UniversitiesResponse> {
  try {
    if (!supabase) {
      return { data: [], error: 'Supabase nu este configurat' };
    }

    let query = supabase.from('universities').select('*');
    
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: 'Nu s-au putut încărca universitățile' };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching universities:', error);
    return { data: [], error: 'Nu s-au putut încărca universitățile' };
  }
}

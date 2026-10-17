/**
 * Careers service
 * Handles career-related API operations
 */

import { supabase } from '../lib';
import { Career, ExploreFilters } from '../types';

export interface CareersResponse {
  data: Career[];
  error: string | null;
}

/**
 * Fetch a single career by ID
 * @param id - Career ID
 * @returns Career data or error
 */
export async function fetchCareer(id: string): Promise<{ data: Career | null; error: string | null }> {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase nu este configurat' };
    }

    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: 'Nu s-a putut încărca cariera' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching career:', error);
    return { data: null, error: 'Nu s-a putut încărca cariera' };
  }
}

/**
 * Fetch careers with optional filters
 * @param filters - Optional filters (domain, search)
 * @returns Careers array or error
 */
export async function fetchCareers(filters?: ExploreFilters): Promise<CareersResponse> {
  try {
    if (!supabase) {
      return { data: [], error: 'Supabase nu este configurat' };
    }

    let query = supabase.from('careers').select('*');
    
    if (filters?.domain) {
      query = query.ilike('domain', `%${filters.domain}%`);
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: 'Nu s-au putut încărca carierele' };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching careers:', error);
    return { data: [], error: 'Nu s-au putut încărca carierele' };
  }
}

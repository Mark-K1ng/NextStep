/**
 * Courses service
 * Handles course-related API operations
 */

import { supabase } from '../lib';
import { Course, ExploreFilters } from '../types';

export interface CoursesResponse {
  data: Course[];
  error: string | null;
}

/**
 * Fetch a single course by ID
 * @param id - Course ID
 * @returns Course data or error
 */
export async function fetchCourse(id: string): Promise<{ data: Course | null; error: string | null }> {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase nu este configurat' };
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: 'Nu s-a putut încărca cursul' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { data: null, error: 'Nu s-a putut încărca cursul' };
  }
}

/**
 * Fetch courses with optional filters
 * @param filters - Optional filters (is_free, level, language, search)
 * @returns Courses array or error
 */
export async function fetchCourses(filters?: ExploreFilters): Promise<CoursesResponse> {
  try {
    if (!supabase) {
      return { data: [], error: 'Supabase nu este configurat' };
    }

    let query = supabase.from('courses').select('*');
    
    if (filters?.is_free !== null && filters?.is_free !== undefined) {
      query = query.eq('is_free', filters.is_free);
    }
    
    if (filters?.level) {
      query = query.ilike('level', `%${filters.level}%`);
    }
    
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: 'Nu s-au putut încărca cursurile' };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { data: [], error: 'Nu s-au putut încărca cursurile' };
  }
}

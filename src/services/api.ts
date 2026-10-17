/**
 * Base API client for Supabase operations
 * Provides a consistent interface for API calls with error handling
 */

import { supabase } from '../lib';
import { ERROR_MESSAGES } from '../constants';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Base API client with common methods
 */
export class ApiClient {
  /**
   * Generic fetch method for single record
   * @param table - Table name
   * @param id - Record ID
   * @returns API response with data or error
   */
  static async fetchOne<T>(table: string, id: string): Promise<ApiResponse<T>> {
    try {
      if (!supabase) {
        return { data: null as any, error: ERROR_MESSAGES.DATA_LOAD_FAILED };
      }

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null as any, error: ERROR_MESSAGES.DATA_LOAD_FAILED };
      }

      return { data };
    } catch {
      return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
    }
  }

  /**
   * Generic fetch method for multiple records
   * @param table - Table name
   * @param filters - Optional filters
   * @returns API response with data or error
   */
  static async fetchMany<T>(
    table: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<T[]>> {
    try {
      if (!supabase) {
        return { data: [], error: ERROR_MESSAGES.DATA_LOAD_FAILED };
      }

      let query = supabase.from(table).select('*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: ERROR_MESSAGES.DATA_LOAD_FAILED };
      }

      return { data: data || [] };
    } catch {
      return { data: [], error: ERROR_MESSAGES.UNKNOWN_ERROR };
    }
  }

  /**
   * Generic paginated fetch method
   * @param table - Table name
   * @param filters - Optional filters
   * @param limit - Number of records per page
   * @param cursor - Optional cursor for pagination
   * @returns Paginated response
   */
  static async fetchPaginated<T>(
    table: string,
    filters?: Record<string, any>,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResponse<T>> {
    try {
      if (!supabase) {
        return { data: [], has_more: false };
      }

      let query = supabase.from(table).select('*', { count: 'exact' }).limit(limit);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (cursor) {
        query = query.gt('id', cursor);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: [], has_more: false };
      }

      const hasMore = count ? data.length < count : false;
      const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : undefined;

      return {
        data: data || [],
        next_cursor: nextCursor,
        has_more: hasMore,
      };
    } catch {
      return { data: [], has_more: false };
    }
  }

  /**
   * Generic insert method
   * @param table - Table name
   * @param data - Data to insert
   * @returns API response with inserted data or error
   */
  static async insert<T>(table: string, data: any): Promise<ApiResponse<T>> {
    try {
      if (!supabase) {
        return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
      }

      const { data: insertedData, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
      }

      return { data: insertedData };
    } catch {
      return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
    }
  }

  /**
   * Generic update method
   * @param table - Table name
   * @param id - Record ID
   * @param data - Data to update
   * @returns API response with updated data or error
   */
  static async update<T>(table: string, id: string, data: any): Promise<ApiResponse<T>> {
    try {
      if (!supabase) {
        return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
      }

      const { data: updatedData, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
      }

      return { data: updatedData };
    } catch {
      return { data: null as any, error: ERROR_MESSAGES.UNKNOWN_ERROR };
    }
  }

  /**
   * Generic delete method
   * @param table - Table name
   * @param id - Record ID
   * @returns API response with success or error
   */
  static async delete(table: string, id: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { data: undefined, error: ERROR_MESSAGES.UNKNOWN_ERROR };
      }

      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) {
        return { data: undefined, error: ERROR_MESSAGES.UNKNOWN_ERROR };
      }

      return { data: undefined };
    } catch {
      return { data: undefined, error: ERROR_MESSAGES.UNKNOWN_ERROR };
    }
  }
}

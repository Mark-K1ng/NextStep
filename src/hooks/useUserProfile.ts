/**
 * User profile hook
 * Handles profile fetching and updates
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib';
import { Profile } from '../types';
import { ERROR_MESSAGES } from '../constants';

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string;
}

export interface UseUserProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for user profile operations
 * @returns Profile state and profile methods
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  const clearError = useCallback(() => {
    if (isMounted.current) {
      setError('');
    }
  }, []);

  const fetchCurrentUserProfile = async () => {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // User doesn't have a profile yet, that's okay
        return;
      }

      if (isMounted.current) {
        setProfile(data);
      }
    } catch {
      // Error in fetchCurrentUserProfile
    }
  };

  useEffect(() => {
    isMounted.current = true;
    // Fetch current user's profile on mount
    setTimeout(() => {
      fetchCurrentUserProfile();
    }, 0);

    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Fetch user profile by user ID
   * @param userId - The user's ID from Supabase auth
   */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (isMounted.current) {
        setError('');
        setLoading(true);
      }

      if (!supabase) {
        if (isMounted.current) {
          setError(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (isMounted.current) {
          setError(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
        }
        return;
      }

      if (isMounted.current) {
        setProfile(data);
      }
    } catch {
      if (isMounted.current) {
        setError(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Update user profile
   * @param userId - The user's ID from Supabase auth
   * @param updates - Partial profile data to update
   */
  const updateProfile = useCallback(async (userId: string, updates: Partial<Profile>) => {
    try {
      if (isMounted.current) {
        setError('');
        setLoading(true);
      }

      if (!supabase) {
        if (isMounted.current) {
          setError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
        }
        return;
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        if (isMounted.current) {
          setError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
        }
        return;
      }

      if (isMounted.current) {
        setProfile(data);
      }
    } catch {
      if (isMounted.current) {
        setError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
  };
}

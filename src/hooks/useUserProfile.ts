/**
 * User profile hook
 * Handles profile fetching and updates
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { Profile } from '../types';
import { ERROR_MESSAGES } from '../constants';

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string;
}

export interface UseUserProfileReturn {
  profileState: ProfileState;
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

  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Fetch user profile by user ID
   * @param userId - The user's ID from Supabase auth
   */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setError('');
      setLoading(true);

      if (!supabase) {
        setError(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        setError(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
        return;
      }

      setProfile(data);
    } catch {
      setError(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param userId - The user's ID from Supabase auth
   * @param updates - Partial profile data to update
   */
  const updateProfile = useCallback(async (userId: string, updates: Partial<Profile>) => {
    try {
      setError('');
      setLoading(true);

      if (!supabase) {
        setError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
        return;
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        setError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
        return;
      }

      setProfile(data);
    } catch {
      setError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profileState: { profile, loading, error },
    fetchProfile,
    updateProfile,
    clearError,
  };
}

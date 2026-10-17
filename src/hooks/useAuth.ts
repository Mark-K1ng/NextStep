/**
 * Authentication hook
 * Handles user authentication state and auth operations
 */

import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib';
import { registerSchema } from '../lib/validators';
import { ERROR_MESSAGES } from '../constants';

export interface AuthState {
  user: any;
  loading: boolean;
  error: string;
}

export interface UseAuthReturn {
  authState: AuthState;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for authentication operations
 * @returns Auth state and auth methods
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Sign up a new user with email and password
   * @param email - User's email address
   * @param password - User's password (min 10 characters)
   * @param displayName - User's display name
   */
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setError('');
      setLoading(true);

      // Validate input
      const result = registerSchema.safeParse({
        email,
        password,
        displayName,
        gradeLevel: 'IX',
        county: 'București',
        favoriteSubjects: ['informatica'],
        interests: ['tehnologie'],
      });

      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }

      if (!supabase) {
        setError(ERROR_MESSAGES.AUTH_SIGNUP_FAILED);
        return;
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        
        // Check if user already exists
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          setError(ERROR_MESSAGES.AUTH_EMAIL_EXISTS);
          return;
        }
        
        // Handle database error - user might still be created
        if (signUpError.message.includes('Database error')) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInData.user) {
            // Create profile manually
            try {
              await supabase.from('profiles').insert({
                id: signInData.user.id,
                display_name: displayName,
                grade_level: 'IX',
                county: 'București',
                interests: ['tehnologie'],
                favorite_subjects: ['informatica'],
              });
            } catch (_err) {
              console.error('Profile creation failed:', _err);
            }
            router.push({ pathname: '/(auth)/screens/verify-email', params: { email } } as any);
            return;
          }
        }
        
        setError(signUpError.message);
        return;
      }

      // If user was created successfully, create profile manually
      if (data.user) {
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            display_name: displayName,
            grade_level: 'IX',
            county: 'București',
            interests: ['tehnologie'],
            favorite_subjects: ['informatica'],
          });
        } catch (_err) {
          console.error('Profile creation failed:', _err);
        }

        router.push({ pathname: '/(auth)/screens/verify-email', params: { email } } as any);
      } else {
        setError(ERROR_MESSAGES.AUTH_SIGNUP_FAILED);
      }
    } catch {
      setError(ERROR_MESSAGES.AUTH_SIGNUP_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError('');
      setLoading(true);

      if (!supabase) {
        setError(ERROR_MESSAGES.AUTH_NOT_AUTHENTICATED);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(ERROR_MESSAGES.AUTH_LOGIN_FAILED);
        return;
      }

      if (data.user) {
        setUser(data.user);
        router.replace('/(tabs)');
      }
    } catch {
      setError(ERROR_MESSAGES.AUTH_LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    try {
      await supabase?.auth.signOut();
      setUser(null);
      router.replace('/(auth)/screens/login');
    } catch (_err) {
      console.error('Sign out error:', _err);
    }
  }, []);

  /**
   * Reset password for an email
   * @param email - User's email address
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError('');
      setLoading(true);

      if (!supabase) {
        setError(ERROR_MESSAGES.AUTH_NOT_AUTHENTICATED);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError(ERROR_MESSAGES.AUTH_LOGIN_FAILED);
        return;
      }

      // Success - navigate to check email screen
      router.push('/(auth)/screens/forgot-password');
    } catch {
      setError(ERROR_MESSAGES.AUTH_LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    authState: { user, loading, error },
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearError,
  };
}

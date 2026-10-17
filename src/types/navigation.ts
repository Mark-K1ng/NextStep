/**
 * Navigation types for Expo Router
 */

/**
 * Verify email screen params
 */
export interface VerifyEmailParams {
  email: string;
}

/**
 * Reset password screen params
 */
export interface ResetPasswordParams {
  token: string;
}

/**
 * Detail screen params
 */
export interface DetailParams {
  id: string;
  type: 'school' | 'university' | 'program' | 'career' | 'course';
}

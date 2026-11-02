import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { parseAuthCallback } from './auth-callback';
import { completeRegistration } from '@/services/registration';
export function needsProfileCompletion(user: User) {
  const provider = user.app_metadata?.provider;
  return (
    (provider === 'google' || provider === 'apple') &&
    user.user_metadata?.nextstep_profile_complete !== true
  );
}
type FinishedAuth = { user: User; recovery: boolean };
let current: {
  url: string;
  promise: Promise<FinishedAuth>;
  expires: number;
} | null = null;
export function clearAuthCallbackCache() {
  current = null;
}
export function finishAuthCallback(url: string): Promise<FinishedAuth> {
  // Router deep links and the native browser can deliver the same one-use code together.
  if (current?.url === url && current.expires > Date.now()) {
    return current.promise;
  }
  const promise = (async () => {
    const callback = parseAuthCallback(url);
    if (callback.error) {
      throw new Error('Authentication link rejected');
    }
    // Only accept codes bound to this installation's stored PKCE verifier.
    // Importing tokens from a deep link allows an attacker to inject their session.
    const result = callback.code
      ? await supabase.auth.exchangeCodeForSession(callback.code)
      : null;
    if (!result || result.error || !result.data.user) {
      throw new Error('Invalid authentication link');
    }
    if (!callback.recovery) {
      await completeRegistration(result.data.user);
    }
    return { user: result.data.user, recovery: callback.recovery };
  })();
  current = { url, promise, expires: Date.now() + 60_000 };
  promise.catch(() => {
    if (current?.promise === promise) {
      current = null;
    }
  });
  return promise;
}

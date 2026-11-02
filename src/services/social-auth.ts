import { Platform } from 'react-native';
import { createURL } from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { finishAuthCallback } from '@/lib/finish-auth';
export class ProviderNotEnabledError extends Error {}
export async function signInWithSocialProvider(provider: 'google' | 'apple') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const response = await fetch(supabaseUrl + '/auth/v1/settings', {
    headers: { apikey: supabaseAnonKey },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error('Auth settings unavailable');
  }
  const settings = await response.json();
  if (settings.external?.[provider] !== true) {
    throw new ProviderNotEnabledError();
  }
  const redirectTo = createURL('/auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error) {
    throw error;
  }
  if (Platform.OS === 'web') {
    return null;
  }
  if (!data.url) {
    throw new Error('Missing OAuth URL');
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    return null;
  }
  return finishAuthCallback(result.url);
}

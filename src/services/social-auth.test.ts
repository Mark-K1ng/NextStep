import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { finishAuthCallback } from '@/lib/finish-auth';
import { ProviderNotEnabledError, signInWithSocialProvider } from './social-auth';
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-linking', () => ({ createURL: () => 'nextstep://auth-callback' }));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('@/lib/finish-auth', () => ({ finishAuthCallback: jest.fn() }));
jest.mock('@/lib/supabase', () => ({ supabaseUrl: 'https://project.supabase.co', supabaseAnonKey: 'public-key', supabase: { auth: { signInWithOAuth: jest.fn() } } }));
beforeEach(() => {
 jest.resetAllMocks(); Platform.OS = 'web';
 Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ external: { google: true } }) }) });
 jest.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: { provider: 'google', url: 'https://accounts.google.com/sign-in' }, error: null });
});
it('reports a disabled provider before navigating away from the app', async () => {
 Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ external: { google: false } }) }) });
 await expect(signInWithSocialProvider('google')).rejects.toBeInstanceOf(ProviderNotEnabledError);
 expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
});
it('uses the SDK browser redirect on web', async () => {
 await signInWithSocialProvider('google');
 expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'nextstep://auth-callback', skipBrowserRedirect: false } });
 expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
});
it('leaves a cancelled native login without creating a session', async () => {
 Platform.OS = 'android';
 jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'cancel' });
 await expect(signInWithSocialProvider('google')).resolves.toBeNull();
 expect(finishAuthCallback).not.toHaveBeenCalled();
});
it('finishes a successful native callback through the shared code handler', async () => {
 Platform.OS = 'android';
 jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'nextstep://auth-callback?code=one-use' });
 await signInWithSocialProvider('google');
 expect(finishAuthCallback).toHaveBeenCalledWith('nextstep://auth-callback?code=one-use');
});

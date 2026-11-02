import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { clearAuthCallbackCache, finishAuthCallback, needsProfileCompletion } from './finish-auth';
import { completeRegistration } from '@/services/registration';
jest.mock('./supabase', () => ({ supabase: { auth: { exchangeCodeForSession: jest.fn(), setSession: jest.fn() } } }));
jest.mock('@/services/registration', () => ({ completeRegistration: jest.fn() }));
const user = { id: 'owner', email_confirmed_at: 'confirmed', app_metadata: { provider: 'google' }, user_metadata: {} } as User;
beforeEach(() => { jest.resetAllMocks(); clearAuthCallbackCache(); });
it('exchanges a code only once when router and browser receive the same callback', async () => {
 jest.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({ data: { user, session: null }, error: null });
 const url = 'nextstep://auth-callback?code=one-use-code';
 await Promise.all([finishAuthCallback(url), finishAuthCallback(url)]);
 expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
 expect(completeRegistration).toHaveBeenCalledTimes(1);
});
it('preserves recovery intent for PKCE password reset', async () => {
 jest.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({ data: { user, session: null }, error: null });
 expect((await finishAuthCallback('nextstep://auth-callback?code=recovery&type=recovery')).recovery).toBe(true);
 expect(completeRegistration).not.toHaveBeenCalled();
});
it('rejects provider errors without attempting a token exchange', async () => {
 await expect(finishAuthCallback('nextstep://auth-callback?error=access_denied')).rejects.toThrow('rejected');
 expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
});
it('rejects injected bearer tokens instead of replacing the local session', async () => {
 await expect(finishAuthCallback('nextstep://auth-callback#access_token=attacker&refresh_token=attacker-refresh&type=recovery')).rejects.toThrow('Invalid authentication link');
 expect(supabase.auth.setSession).not.toHaveBeenCalled();
 expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
});
it('requires profile completion for new social accounts without affecting email accounts', () => {
 expect(needsProfileCompletion(user)).toBe(true);
 expect(needsProfileCompletion({ ...user, user_metadata: { nextstep_profile_complete: true } })).toBe(false);
 expect(needsProfileCompletion({ ...user, app_metadata: { provider: 'email' } })).toBe(false);
});

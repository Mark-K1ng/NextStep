import { createClient } from '@supabase/supabase-js';
import { authStorage } from './auth-storage';
import { supabase } from './supabase';
jest.mock('./pkce-crypto', () => ({ installPkceCrypto: jest.fn() }));

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ auth: {} })) }));

it('configures persistent sessions with the platform storage adapter', () => {
  expect(supabase).toBeDefined();
  expect(createClient).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
    auth: { flowType: 'pkce', storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
});

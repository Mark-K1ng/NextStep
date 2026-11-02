import { createClient } from '@supabase/supabase-js';
import { authStorage } from './auth-storage';
import { installPkceCrypto } from './pkce-crypto';

installPkceCrypto();

// Initialize Supabase client
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

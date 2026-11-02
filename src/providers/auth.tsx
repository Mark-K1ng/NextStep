import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthCallbackCache } from '@/lib/finish-auth';

const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  error: boolean;
  retry(): void;
}>({ session: null, loading: true, error: false, retry() {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;
    setLoading(true);
    setError(false);
    const timeout = setTimeout(() => {
      if (active && !receivedAuthEvent) {
        setError(true);
        setLoading(false);
      }
    }, 12_000);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (_event === 'SIGNED_OUT') {
        clearAuthCallbackCache();
        queryClient.clear();
      }
      receivedAuthEvent = true;
      if (active) {
        clearTimeout(timeout);
        setError(false);
        setSession(nextSession);
        setLoading(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error: restoreError }) => {
        if (active && !receivedAuthEvent) {
          if (restoreError) {
            console.error('Unable to restore session');
          }
          clearTimeout(timeout);
          setError(!!restoreError);
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active && !receivedAuthEvent) {
          console.error('Unable to restore session');
          clearTimeout(timeout);
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [queryClient, attempt]);
  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        error,
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useSession = () => useContext(AuthContext);

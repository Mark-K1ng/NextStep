import { Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/use-supabase';
import type { Session } from '@supabase/supabase-js';

export default function Index() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false); // Still hide loading on error to avoid stuck state
    });
  }, [supabase]);

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href='/_tabs/home' />;
  } else {
    return <Redirect href='/welcome' />;
  }
}

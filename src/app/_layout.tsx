import * as SplashScreen from 'expo-splash-screen';
import { createContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider, DefaultTheme, DarkTheme } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useSupabase } from '@/hooks/use-supabase';

import type { Session } from '@supabase/supabase-js';

export const ThemeContext = createContext({ isDark: false });

export default function TabLayout({ children }) {
  // Prevent splash screen from auto hiding
  SplashScreen.preventAutoHideAsync();

  const colorScheme = useColorScheme();
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { supabase } = useSupabase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const fetchedSession = data.session;
      setAuthSession(fetchedSession);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false); // Still hide loading on error to avoid stuck state
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sessionParam) => {
      setAuthSession(sessionParam);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Hide splash screen when loading is complete
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  const themeValue = { isDark: colorScheme === 'dark' };

  if (loading) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ThemeContext.Provider value={themeValue}>
          <AnimatedSplashOverlay />
        </ThemeContext.Provider>
      </ThemeProvider>
    );
  }

  // When not logged in, show the children (auth screens) without tabs
  if (!authSession) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ThemeContext.Provider value={themeValue}>
          {children}
        </ThemeContext.Provider>
      </ThemeProvider>
    );
  }

  // When logged in, show the tabs (NativeTabs will render the tab screens based on route)
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ThemeContext.Provider value={themeValue}>
        <AppTabs />
      </ThemeContext.Provider>
    </ThemeProvider>
  );
}

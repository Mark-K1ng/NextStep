import * as SplashScreen from "expo-splash-screen";
import { createContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { useSupabase } from "@/hooks/use-supabase";

import type { Session } from "@supabase/supabase-js";

export const ThemeContext = createContext({ isDark: false });

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { supabase } = useSupabase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const themeValue = { isDark: colorScheme === "dark" };

  if (loading) {
    return (
      <ThemeContext.Provider value={themeValue}>
        <AnimatedSplashOverlay />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      {session ? <AppTabs /> : null}
    </ThemeContext.Provider>
  );
}

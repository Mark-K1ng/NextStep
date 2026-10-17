import { Stack , router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
  });
  const [sessionChecked, setSessionChecked] = useState(!supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    // Check for existing session on startup
    const checkSession = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      }
      setSessionChecked(true);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || !sessionChecked) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18171F' }} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(modals)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}

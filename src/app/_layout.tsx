import { ThemePreferenceProvider } from '@/providers/theme';
import { PaletteProvider, usePalettePreference } from '@/providers/palette';
import { NavigationThemeProvider } from '@/providers/navigation-theme';
import { SavedProvider } from '@/providers/saved';
import { QueryProvider } from '@/providers/query';
import { Stack } from 'expo-router';
import { renderAsciiScreen } from '@/components/route-ascii-reveal';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { AsciiLoadingProvider } from '@/components/ascii-loading';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useSession } from '@/providers/auth';
import { useTheme } from '@/hooks/use-theme';
import { useStackMotion } from '@/hooks/use-stack-motion';
import { useFonts, FontDisplay } from 'expo-font';
import { DataState } from '@/components/data-state';
import { Brand, Screen } from '@/components/design';
import { needsProfileCompletion } from '@/lib/finish-auth';
import { ToastProvider } from '@/providers/toast';
import { JourneyProvider } from '@/providers/journey';
import { MotionProvider } from '@/providers/motion';
import { useAccountMode } from '@/providers/account-mode';
import { AccountModeProvider } from '@/providers/account-mode-provider';
import { NavigationFrame } from '@/components/navigation-frame';
import { SelectionPopupProvider } from '@/providers/selection-popup';
import { usePersonalization } from '@/hooks/use-personalization';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { PlusJakartaSans_800ExtraBold_Italic } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold_Italic';

SplashScreen.preventAutoHideAsync().catch(console.error);

function RootNavigator() {
  const { ready: paletteReady } = usePalettePreference();
  const [fontsLoaded, fontError] = useFonts([
    {
      fontFamily: 'PlusJakartaSans',
      fontDefinitions: [
        {
          path: PlusJakartaSans_400Regular,
          weight: 400,
          display: FontDisplay.SWAP,
        },
        {
          path: PlusJakartaSans_500Medium,
          weight: 500,
          display: FontDisplay.SWAP,
        },
        {
          path: PlusJakartaSans_600SemiBold,
          weight: 600,
          display: FontDisplay.SWAP,
        },
        {
          path: PlusJakartaSans_700Bold,
          weight: 700,
          display: FontDisplay.SWAP,
        },
        {
          path: PlusJakartaSans_800ExtraBold,
          weight: 800,
          display: FontDisplay.SWAP,
        },
        {
          path: PlusJakartaSans_800ExtraBold_Italic,
          weight: 800,
          style: 'italic',
          display: FontDisplay.SWAP,
        },
      ],
    },
  ]);
  const { session, loading, error: authError, retry: retryAuth } = useSession();
  const account = useAccountMode();
  const personalization = usePersonalization();
  const fontsReady = Platform.OS === 'web' || fontsLoaded || !!fontError;
  const needsSetup =
    session && !account.isTeacher
      ? needsProfileCompletion(session.user)
      : false;
  const pendingRegistration =
    !account.isTeacher &&
    !!session?.user.user_metadata.nextstep_profile_pending;
  const theme = useTheme();
  const stackMotion = useStackMotion();
  const needsPersonalization =
    !!session?.user.email_confirmed_at &&
    !needsSetup &&
    !pendingRegistration &&
    !account.isTeacher;
  const startupPending =
    loading ||
    !paletteReady ||
    !fontsReady ||
    account.isPending ||
    (needsPersonalization && personalization.isPending);
  const startupError =
    !!authError ||
    (!!account.error && !account.access) ||
    (needsPersonalization && personalization.isError && !personalization.data);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Native transitions can briefly expose the Android window beneath React.
      SystemUI.setBackgroundColorAsync(theme.background).catch(console.error);
    }
  }, [theme.background]);
  useEffect(() => {
    if (
      !loading &&
      paletteReady &&
      (fontsReady || authError) &&
      (!startupPending || startupError)
    ) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [
    loading,
    fontsReady,
    authError,
    paletteReady,
    startupPending,
    startupError,
  ]);
  if (authError) {
    return (
      <Screen>
        <Brand />
        <DataState error retry={retryAuth} />
      </Screen>
    );
  }
  if (account.error && !account.access) {
    return (
      <Screen>
        <Brand />
        <DataState error retry={() => account.refresh()} />
      </Screen>
    );
  }
  if (
    session?.user.email_confirmed_at &&
    !needsSetup &&
    !pendingRegistration &&
    !account.isTeacher &&
    personalization.isError &&
    !personalization.data
  ) {
    return (
      <Screen>
        <DataState error retry={() => personalization.refetch()} />
      </Screen>
    );
  }
  if (startupPending) {
    // Keep the native launch surface until a real destination/error can render.
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]} />
    );
  }

  return (
    <NavigationFrame>
      <Stack
        id={undefined}
        screenOptions={stackMotion}
        screenLayout={renderAsciiScreen}
      >
        <Stack.Screen name='index' />
        <Stack.Screen name='(auth)' />
        <Stack.Screen name='privacy' />
        <Stack.Screen name='terms' />
        <Stack.Protected
          guard={!!session?.user.email_confirmed_at && account.isTeacher}
        >
          <Stack.Screen name='teacher' />
        </Stack.Protected>
        <Stack.Protected
          guard={
            !!session?.user.email_confirmed_at &&
            !!account.access &&
            (account.isTeacher ||
              (!needsSetup &&
                !pendingRegistration &&
                (EDUCATION_ROUTES_ENABLED ||
                  !personalization.data?.onboarding_required)))
          }
        >
          <Stack.Screen name='settings' />
          <Stack.Screen name='palette' />
          <Stack.Screen name='privacy-and-data' />
          <Stack.Screen name='qa' />
          <Stack.Screen name='data-export' />
          <Stack.Screen name='delete-account' />
          <Stack.Protected guard={__DEV__}>
            <Stack.Screen name='loading-preview' />
          </Stack.Protected>
        </Stack.Protected>
        <Stack.Screen
          name='selection-popup'
          options={{
            presentation: 'formSheet',
            headerShown: false,
            sheetAllowedDetents: [0.75, 1],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            sheetExpandsWhenScrolledToEdge: false,
            sheetCornerRadius: 24,
            contentStyle: { backgroundColor: theme.surface },
          }}
        />
        <Stack.Protected
          guard={!!session?.user.email_confirmed_at && needsSetup}
        >
          <Stack.Screen name='complete-profile' />
        </Stack.Protected>
        <Stack.Protected
          guard={
            !!session?.user.email_confirmed_at &&
            !needsSetup &&
            !pendingRegistration &&
            account.access?.account_kind === 'student'
          }
        >
          <Stack.Screen name='personalize' />
          <Stack.Screen name='questionnaire' />
        </Stack.Protected>
        <Stack.Protected
          guard={
            !!session?.user.email_confirmed_at &&
            !needsSetup &&
            !pendingRegistration &&
            ((account.access?.account_kind === 'student' &&
              (EDUCATION_ROUTES_ENABLED ||
                !personalization.data?.onboarding_required)) ||
              account.isPreview)
          }
        >
          <Stack.Screen name='_tabs' />
          <Stack.Screen name='tutoring' />
          <Stack.Screen name='explore' />
          <Stack.Screen name='school/[id]' />
          <Stack.Screen name='program/[id]' />
          <Stack.Screen name='career/[id]' />
          <Stack.Screen name='course/[id]' />
          <Stack.Screen name='university/[id]' />
          <Stack.Screen name='objective' />
          <Stack.Screen name='saved' />
          <Stack.Screen name='compare' />
          <Stack.Screen name='recommendations' />
          <Stack.Screen name='specialization/[id]' />
          <Stack.Screen name='skill/[id]' />
        </Stack.Protected>
      </Stack>
    </NavigationFrame>
  );
}
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <MotionProvider>
        <ThemePreferenceProvider>
          <PaletteProvider>
            <AsciiLoadingProvider>
              <NavigationThemeProvider>
                <QueryProvider>
                  <AuthProvider>
                    <AccountModeProvider>
                      <SavedProvider>
                        <JourneyProvider>
                          <ToastProvider>
                            <SelectionPopupProvider>
                              <RootNavigator />
                            </SelectionPopupProvider>
                          </ToastProvider>
                        </JourneyProvider>
                      </SavedProvider>
                    </AccountModeProvider>
                  </AuthProvider>
                </QueryProvider>
              </NavigationThemeProvider>
            </AsciiLoadingProvider>
          </PaletteProvider>
        </ThemePreferenceProvider>
      </MotionProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

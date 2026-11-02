import { spacing as s } from '@/theme/tokens';
import { Platform } from 'react-native';
import { PrivacyLinks } from './PrivacyPages';
import { useThemePreference } from '@/providers/theme';
import { useTheme } from '@/hooks/use-theme';

import { showMessage } from '@/lib/show-message';
import type { Profile } from '@/types/models';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Button } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import { useSupabase } from '@/hooks/use-supabase';

import {
  Screen,
  Copy,
  Panel,
  Row,
  Choice,
  design,
  BackHeader,
} from '@/components/design';
import { DataState } from '@/components/data-state';
import { CircleUserRound, LockKeyhole } from 'lucide-react-native';
import { ro } from '@/i18n/ro';
import { View } from 'react-native';
import { useAccountMode } from '@/providers/account-mode';
import { appVersionLabel } from '@/lib/app-feedback';

export default function Settings() {
  const router = useRouter();
  const { isTeacher } = useAccountMode();
  const theme = useTheme();

  const { supabase } = useSupabase();
  const { session } = useSession();
  const profileQuery = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .abortSignal(signal)
        .single();
      if (error) {
        throw error;
      }
      return data as Profile;
    },
  });
  const profile = profileQuery.data;
  const loading = profileQuery.isPending;
  const { mode: themeMode, setMode: setThemeMode } = useThemePreference();
  const handleEditProfile = () => {
    router.push(isTeacher ? '/teacher/profile' : '/_tabs/profile');
  };

  const handleChangeTheme = (value: 'system' | 'dark' | 'light') => {
    setThemeMode(value);
  };

  const handleLogout = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      router.replace('/(auth)/login');
    } catch {
      console.error('Sign out failed');
      showMessage(ro.feedback.logoutFailed);
    }
  };

  return (
    <Screen tab='profile' nativeTitle={ro.settings.title}>
      {Platform.OS !== 'ios' && <BackHeader title={ro.settings.title} />}
      {loading || !profile ? (
        <DataState
          loadingLayout='settings'
          loading={loading}
          error={profileQuery.isError}
          retry={() => {
            profileQuery.refetch();
          }}
        />
      ) : (
        <>
          <Panel>
            <Row
              icon={CircleUserRound}
              title={profile.display_name}
              subtitle={profile.county}
              onPress={handleEditProfile}
            />
          </Panel>
          <View style={{ gap: s.md }}>
            <Copy kind='heading'>{ro.settings.appearance}</Copy>
            <View style={design.wrap}>
              {(['dark', 'light', 'system'] as const).map((value) => (
                <Choice
                  exclusive
                  key={value}
                  selected={themeMode === value}
                  onPress={() => handleChangeTheme(value)}
                >
                  {ro.settings.themeOptions[value]}
                </Choice>
              ))}
            </View>
          </View>
          <Row
            icon={LockKeyhole}
            title={ro.profile.changePassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          />
          {__DEV__ && (
            <Row
              title='Animații ASCII'
              subtitle='Previzualizarea încărcării · dezvoltare'
              onPress={() => router.push('/loading-preview')}
            />
          )}
          <Copy kind='label' style={{ color: theme.textSecondary }}>
            {ro.visual.privacy}
          </Copy>
          <PrivacyLinks />
          <Panel>
            <Row
              title='Semnalează o problemă'
              subtitle='Feedback pentru programul pilot'
              onPress={() => router.push('/feedback')}
            />
            <Copy kind='caption' style={{ color: theme.textSecondary }}>
              NextStep {appVersionLabel()} · program pilot
            </Copy>
          </Panel>
          <Button
            variant='outline'
            onPress={handleLogout}
            textStyle={{ color: theme.dangerText }}
          >
            {ro.visual.signOut}
          </Button>
        </>
      )}
    </Screen>
  );
}

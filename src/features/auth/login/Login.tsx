import { DecodingText as Text } from '@/components/decoding-text';
import { completeRegistration } from '@/services/registration';
import { getAccountAccess } from '@/services/account-access';
import { useTheme } from '@/hooks/use-theme';
import type { Theme } from '@/theme';
import { showMessage } from '@/lib/show-message';
import { View, StyleSheet } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Button, Input } from '@/components';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';
import { useSupabase } from '@/hooks/use-supabase';
import { spacing } from '@/theme/tokens';
import { Brand, Copy, Screen } from '@/components/design';
import { ro } from '@/i18n/ro';
import { SocialSignIn } from '@/components/social-sign-in';
import { useLocalSearchParams } from 'expo-router';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import {
  AccountKindChoice,
  type AccountKindIntent,
} from '../account-kind-choice';

export default function Login() {
  const router = useRouter();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const params = useLocalSearchParams<{ accountKind?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountKind, setAccountKind] = useState<AccountKindIntent>(
    params.accountKind === 'teacher' ? 'teacher' : 'student'
  );

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.code === 'email_not_confirmed') {
          router.replace({
            pathname: '/(auth)/verify-email',
            params: { email: email.trim(), accountKind },
          });
          return;
        }
        throw error;
      }

      const user = data.user;
      if (!user) {
        throw new Error('Missing authenticated user');
      }
      if (!user?.email_confirmed_at) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: email.trim(), accountKind },
        });
      } else {
        try {
          await completeRegistration(user);
        } catch {
          showMessage(ro.feedback.profileFailed);
          return;
        }
        // This read only explains a mismatched entry choice. The root performs
        // the authoritative access gate and owns retry when access is unavailable.
        const access = await getAccountAccess().catch(() => null);
        if (access && access.account_kind !== accountKind) {
          showMessage(
            access.account_kind === 'teacher'
              ? 'Acesta este un cont de profesor. Deschidem contul tău de profesor.'
              : 'Acesta este un cont de elev sau student. Deschidem contul tău de elev.'
          );
        }
        router.replace('/');
      }
    } catch (error) {
      const invalidCredentials =
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'invalid_credentials';
      showMessage(
        invalidCredentials
          ? ro.feedback.loginFailed
          : ro.feedback.loginUnavailable
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen auth>
      <Brand />
      <Copy kind='title'>{ro.visual.loginTitle}</Copy>
      <Copy style={{ color: theme.textSecondary }}>{ro.visual.loginHint}</Copy>
      <AccountKindChoice
        value={accountKind}
        onChange={setAccountKind}
        disabled={loading}
      />
      <Copy kind='caption' style={{ color: theme.textSecondary }}>
        {accountKind === 'teacher'
          ? 'Intră în contul tău de profesor. Tipul contului existent rămâne neschimbat.'
          : 'Intră în contul tău de elev sau student. Tipul contului existent rămâne neschimbat.'}
      </Copy>
      <View style={styles.form}>
        <Input
          label={t('auth.email')}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
        />
        <Input
          label={t('auth.password')}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
          disabled={!(email && password)}
        >
          {t('auth.login')}
        </Button>
        <View style={styles.links}>
          <Text
            style={styles.linkText}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            {t('auth.forgotPassword')}
          </Text>
          <Text
            style={styles.linkText}
            onPress={() =>
              router.push({
                pathname:
                  EDUCATION_ROUTES_ENABLED && accountKind === 'student'
                    ? '/(auth)/onboarding/2'
                    : '/(auth)/register',
                params: { accountKind },
              })
            }
          >
            {t('auth.register')}
          </Text>
        </View>
      </View>
      {accountKind === 'student' && <SocialSignIn />}
    </Screen>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      backgroundColor: theme.background,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: spacing.md,
      alignSelf: 'center',
    },
    title: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '700' as const,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    form: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    links: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    linkText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
  });
}

import { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Button } from './Button';
import { Copy } from './design';
import {
  ProviderNotEnabledError,
  signInWithSocialProvider,
} from '@/services/social-auth';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { spacing as s } from '@/theme/tokens';
import {
  APPLE_AUTH_ENABLED,
  GOOGLE_AUTH_ENABLED,
} from '@/constants/release-capabilities';
export function SocialSignIn() {
  const router = useRouter();
  const theme = useTheme();
  const [pending, setPending] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');
  const start = async (provider: 'google' | 'apple') => {
    setPending(provider);
    setError('');
    try {
      const result = await signInWithSocialProvider(provider);
      if (result) {
        router.replace('/');
      }
    } catch (failure) {
      setError(
        failure instanceof ProviderNotEnabledError
          ? ro.visual.providerNotEnabled
          : ro.visual.socialFailed
      );
    } finally {
      setPending(null);
    }
  };
  if (!GOOGLE_AUTH_ENABLED && !(Platform.OS === 'ios' && APPLE_AUTH_ENABLED)) {
    return null;
  }
  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          {ro.visual.or}
        </Copy>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>
      {GOOGLE_AUTH_ENABLED && (
        <Button
          variant='outline'
          loading={pending === 'google'}
          disabled={!!pending}
          onPress={() => start('google')}
        >
          {ro.visual.google}
        </Button>
      )}
      {Platform.OS === 'ios' && APPLE_AUTH_ENABLED && (
        <Button
          variant='outline'
          loading={pending === 'apple'}
          disabled={!!pending}
          onPress={() => start('apple')}
        >
          {ro.visual.apple}
        </Button>
      )}
      {!!error && (
        <Copy
          accessibilityRole='alert'
          kind='caption'
          style={{ color: theme.dangerText }}
        >
          {error}
        </Copy>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: s.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: s.md },
  line: { flex: 1, height: 1 },
});

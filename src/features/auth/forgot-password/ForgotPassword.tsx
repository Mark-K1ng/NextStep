import { useState } from 'react';
import { Check } from 'lucide-react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { createURL } from 'expo-linking';
import { Brand, Copy, Panel, Row, Screen } from '@/components/design';
import { Button, Input } from '@/components';
import { supabase } from '@/lib/supabase';
import { emailSchema } from '@/lib/validators';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
export default function ForgotPassword() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: createURL('/auth-callback', {
          queryParams: { type: 'recovery' },
        }),
      });
      if (result.error && !result.error.message.includes('User not found')) {
        throw result.error;
      }
      setSent(true);
    } catch {
      setError(ro.feedback.resetFailed);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen auth>
      <Brand />
      <Copy kind='title'>{ro.auth.resetPassword}</Copy>
      <Copy style={{ color: theme.textSecondary }}>
        {ro.feedback.resetHint}
      </Copy>
      {sent ? (
        <Panel>
          <Row
            icon={Check}
            title={ro.feedback.emailSent}
            subtitle={ro.feedback.resetSent}
          />
        </Panel>
      ) : (
        <>
          <Input
            label={ro.auth.email}
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            error={error}
            autoComplete='email'
          />
          <Button loading={loading} onPress={submit}>
            {ro.auth.sendResetLink}
          </Button>
        </>
      )}
      <Button variant='outline' onPress={() => router.replace('/(auth)/login')}>
        {ro.auth.login}
      </Button>
    </Screen>
  );
}

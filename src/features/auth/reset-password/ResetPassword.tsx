import { useState } from 'react';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Check } from 'lucide-react-native';
import { Brand, Copy, Panel, Row, Screen } from '@/components/design';
import { Button, Input } from '@/components';
import { supabase } from '@/lib/supabase';
import { passwordSchema } from '@/lib/validators';
import { ro } from '@/i18n/ro';
export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirmation) {
      setError(ro.validation.passwordsDoNotMatch);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Session required');
      }
      const updated = await supabase.auth.updateUser({ password });
      if (updated.error) {
        throw updated.error;
      }
      const signedOut = await supabase.auth.signOut();
      if (signedOut.error) {
        throw signedOut.error;
      }
      setDone(true);
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
      {done ? (
        <Panel>
          <Row icon={Check} title={ro.feedback.passwordUpdated} />
        </Panel>
      ) : (
        <>
          <Input
            label={ro.auth.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete='new-password'
          />
          <Input
            label={ro.auth.confirmPassword}
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoComplete='new-password'
            error={error}
          />
          <Button loading={loading} onPress={submit}>
            {ro.auth.resetPassword}
          </Button>
        </>
      )}
      <Button variant='outline' onPress={() => router.replace('/(auth)/login')}>
        {ro.auth.login}
      </Button>
    </Screen>
  );
}

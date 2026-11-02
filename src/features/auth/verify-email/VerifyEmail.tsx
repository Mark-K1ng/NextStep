import { useEffect, useState } from 'react';
import { MailCheck, Check } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { createURL } from 'expo-linking';
import { Brand, Copy, Panel, Row, Screen } from '@/components/design';
import { Button, Input } from '@/components';
import { supabase } from '@/lib/supabase';
import { completeRegistration } from '@/services/registration';
import { emailSchema } from '@/lib/validators';
import { ro } from '@/i18n/ro';
export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    accountKind?: string;
  }>();
  const [email, setEmail] = useState(params.email || '');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        await completeRegistration(user);
        if (active) {
          setVerified(true);
          router.replace('/');
        }
      }
    };
    check().catch(() => {
      if (active) {
        setError(ro.feedback.profileFailed);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.email_confirmed_at) {
        check().catch(() => {
          if (active) {
            setError(ro.feedback.profileFailed);
          }
        });
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);
  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const resend = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError('');
    setSent(false);
    try {
      const result = await supabase.auth.resend({
        type: 'signup',
        email: parsed.data,
        options: { emailRedirectTo: createURL('/auth-callback') },
      });
      if (result.error) {
        throw result.error;
      }
      setSent(true);
      setCooldown(30);
    } catch (resendError) {
      const limited =
        resendError &&
        typeof resendError === 'object' &&
        (('status' in resendError && resendError.status === 429) ||
          ('code' in resendError &&
            resendError.code === 'over_email_send_rate_limit'));
      setError(
        limited ? ro.feedback.emailRateLimited : ro.feedback.verificationFailed
      );
      if (limited) {
        setCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen auth>
      <Brand />
      <Copy kind='title'>{ro.auth.verifyEmail}</Copy>
      {params.accountKind === 'teacher' && (
        <Copy kind='caption'>
          După confirmare vei continua cu cererea contului de profesor.
          Confirmarea e-mailului nu aprobă funcțiile de predare.
        </Copy>
      )}
      <Panel>
        <Row
          icon={verified ? Check : MailCheck}
          title={verified ? ro.auth.emailVerified : ro.feedback.emailSent}
          subtitle={verified ? undefined : ro.auth.verificationSent}
        />
      </Panel>
      {!verified && (
        <>
          <Input
            label={ro.auth.email}
            keyboardType='email-address'
            value={email}
            onChangeText={setEmail}
            error={error}
            autoComplete='email'
          />
          <Button loading={loading} disabled={cooldown > 0} onPress={resend}>
            {cooldown > 0
              ? ro.common.resendIn + ' ' + cooldown + 's'
              : ro.auth.resendVerification}
          </Button>
          {sent && (
            <Copy accessibilityRole='alert'>
              {ro.feedback.verificationResent}
            </Copy>
          )}
        </>
      )}
      <Button
        variant='outline'
        onPress={() => router.replace(verified ? '/' : '/(auth)/login')}
      >
        {verified ? ro.common.continueToApp : ro.auth.login}
      </Button>
    </Screen>
  );
}

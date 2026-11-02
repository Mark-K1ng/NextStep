import { useEffect, useState } from 'react';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { useLinkingURL } from 'expo-linking';
import { finishAuthCallback } from '@/lib/finish-auth';
import { DataState } from '@/components/data-state';
import { Screen, Copy } from '@/components/design';
import { Button } from '@/components';
import { ro } from '@/i18n/ro';
export default function AuthCallback() {
  const url = useLinkingURL();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!url) {
      return;
    }
    let active = true;
    finishAuthCallback(url)
      .then(({ user, recovery }) => {
        if (active) {
          router.replace(
            recovery
              ? '/(auth)/reset-password'
              : !user.email_confirmed_at
                ? '/(auth)/verify-email'
                : '/'
          );
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [url, router]);
  return (
    <Screen>
      {failed ? (
        <>
          <Copy>{ro.visual.invalidAuthLink}</Copy>
          <Button onPress={() => router.replace('/(auth)/login')}>
            {ro.auth.login}
          </Button>
        </>
      ) : (
        <DataState loading />
      )}
    </Screen>
  );
}

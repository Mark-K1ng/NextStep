import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { completeRegistration } from '@/services/registration';
import { DataState } from './data-state';
import { Screen } from './design';

/** Finish an authenticated signup without sending it to email verification. */
export function RegistrationGate({ user }: { user: User }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    completeRegistration(user).catch(() => {
      if (active) {
        setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [user, attempt]);
  return (
    <Screen>
      <DataState
        loading={!failed}
        error={failed}
        retry={() => setAttempt((n) => n + 1)}
      />
    </Screen>
  );
}
